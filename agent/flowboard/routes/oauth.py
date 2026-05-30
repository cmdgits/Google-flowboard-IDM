"""OAuth routes for social media platform authentication.

Handles OAuth 2.0 flows for TikTok, Facebook, YouTube, and Instagram.
"""
import os
import httpx
import logging
from datetime import datetime, timedelta
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select, Session

from flowboard.db import get_session
from flowboard.db.models import SocialAccount

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/social/oauth", tags=["oauth"])

# OAuth Configuration
OAUTH_CONFIG = {
    "tiktok": {
        "authorize_url": "https://www.tiktok.com/v1/oauth/authorize",
        "token_url": "https://open.tiktokapis.com/v1/oauth/token",
        "client_id": os.getenv("TIKTOK_CLIENT_ID"),
        "client_secret": os.getenv("TIKTOK_CLIENT_SECRET"),
        "redirect_uri": os.getenv("TIKTOK_REDIRECT_URI", "http://localhost:8101/api/social/oauth/tiktok/callback"),
        "scopes": ["user.info.basic", "video.list"],
    },
    "facebook": {
        "authorize_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "client_id": os.getenv("FACEBOOK_CLIENT_ID"),
        "client_secret": os.getenv("FACEBOOK_CLIENT_SECRET"),
        "redirect_uri": os.getenv("FACEBOOK_REDIRECT_URI", "http://localhost:8101/api/social/oauth/facebook/callback"),
        "scopes": ["pages_manage_posts", "pages_read_engagement"],
    },
    "youtube": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "client_id": os.getenv("YOUTUBE_CLIENT_ID"),
        "client_secret": os.getenv("YOUTUBE_CLIENT_SECRET"),
        "redirect_uri": os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:8101/api/social/oauth/youtube/callback"),
        "scopes": ["https://www.googleapis.com/auth/youtube.upload"],
    },
    "instagram": {
        "authorize_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.instagram.com/v18.0/oauth/access_token",
        "client_id": os.getenv("INSTAGRAM_CLIENT_ID"),
        "client_secret": os.getenv("INSTAGRAM_CLIENT_SECRET"),
        "redirect_uri": os.getenv("INSTAGRAM_REDIRECT_URI", "http://localhost:8101/api/social/oauth/instagram/callback"),
        "scopes": ["instagram_business_basic", "instagram_business_content_publish"],
    },
}


@router.get("/{platform}/authorize")
def authorize(platform: str, state: str = None):
    """Redirect user to platform's OAuth authorization page."""
    if platform not in OAUTH_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
    
    config = OAUTH_CONFIG[platform]
    if not config["client_id"]:
        raise HTTPException(status_code=500, detail=f"OAuth not configured for {platform}")
    
    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": " ".join(config["scopes"]),
    }
    
    if state:
        params["state"] = state
    
    # Platform-specific parameters
    if platform == "tiktok":
        params["scope"] = ",".join(config["scopes"])
    elif platform == "facebook" or platform == "instagram":
        params["display"] = "popup"
    
    authorize_url = f"{config['authorize_url']}?{urlencode(params)}"
    
    # In a real app, you'd redirect here
    # For now, return the URL so frontend can redirect
    return {"authorize_url": authorize_url}


@router.get("/{platform}/callback")
async def oauth_callback(platform: str, code: str = Query(None), state: str = Query(None), error: str = Query(None)):
    """Handle OAuth callback from platform."""
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    if platform not in OAUTH_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
    
    config = OAUTH_CONFIG[platform]
    
    try:
        # Exchange code for access token
        token_data = {
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": config["redirect_uri"],
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(config["token_url"], data=token_data)
            response.raise_for_status()
            token_response = response.json()
        
        access_token = token_response.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Get user info from platform
        user_info = await _get_user_info(platform, access_token)
        
        # Save to database
        with get_session() as session:
            account = SocialAccount(
                platform=platform,
                account_id=user_info["account_id"],
                access_token=access_token,
                refresh_token=token_response.get("refresh_token"),
                account_name=user_info.get("account_name"),
                token_expires_at=_calculate_token_expiry(token_response),
            )
            session.add(account)
            session.commit()
        
        # Redirect back to frontend with success
        return {
            "status": "success",
            "platform": platform,
            "account_id": user_info["account_id"],
            "account_name": user_info.get("account_name"),
        }
    
    except Exception as e:
        logger.error(f"OAuth callback error for {platform}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")


async def _get_user_info(platform: str, access_token: str) -> dict:
    """Get user info from platform API."""
    async with httpx.AsyncClient() as client:
        if platform == "tiktok":
            response = await client.get(
                "https://open.tiktokapis.com/v1/user/info/",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"fields": "open_id,display_name"},
            )
            data = response.json()
            return {
                "account_id": data["data"]["user"]["open_id"],
                "account_name": data["data"]["user"].get("display_name"),
            }
        
        elif platform == "facebook":
            response = await client.get(
                "https://graph.facebook.com/me",
                params={"access_token": access_token, "fields": "id,name"},
            )
            data = response.json()
            return {
                "account_id": data["id"],
                "account_name": data.get("name"),
            }
        
        elif platform == "youtube":
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/channels",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"part": "snippet", "mine": "true"},
            )
            data = response.json()
            channel = data["items"][0]
            return {
                "account_id": channel["id"],
                "account_name": channel["snippet"]["title"],
            }
        
        elif platform == "instagram":
            response = await client.get(
                "https://graph.instagram.com/me",
                params={"access_token": access_token, "fields": "id,username"},
            )
            data = response.json()
            return {
                "account_id": data["id"],
                "account_name": data.get("username"),
            }


def _calculate_token_expiry(token_response: dict) -> datetime:
    """Calculate token expiry time from response."""
    expires_in = token_response.get("expires_in")
    if expires_in:
        return datetime.utcnow() + timedelta(seconds=expires_in)
    return None

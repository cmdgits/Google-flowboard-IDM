"""Platform posting service for social media integration.

Handles posting content to Facebook, TikTok, YouTube, and Instagram.
"""
import logging
import httpx
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class PlatformPoster:
    """Service for posting content to social media platforms."""

    def __init__(self):
        self.client = httpx.AsyncClient()

    async def post_to_facebook(
        self,
        page_id: str,
        access_token: str,
        content: str,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Post content to Facebook page.
        
        Args:
            page_id: Facebook page ID
            access_token: Page access token
            content: Post content/caption
            image_url: Optional image URL to attach
            
        Returns:
            Dict with post_id and status
        """
        try:
            url = f"https://graph.facebook.com/v18.0/{page_id}/feed"
            
            data = {
                "message": content,
                "access_token": access_token,
            }
            
            if image_url:
                data["picture"] = image_url
            
            response = await self.client.post(url, data=data)
            response.raise_for_status()
            
            result = response.json()
            return {
                "status": "success",
                "platform": "facebook",
                "post_id": result.get("id"),
                "url": f"https://facebook.com/{result.get('id')}",
            }
        except Exception as e:
            logger.error(f"Facebook posting error: {str(e)}")
            return {
                "status": "failed",
                "platform": "facebook",
                "error": str(e),
            }

    async def post_to_tiktok(
        self,
        access_token: str,
        content: str,
        video_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Post content to TikTok.
        
        Args:
            access_token: TikTok access token
            content: Post caption
            video_url: Optional video URL
            
        Returns:
            Dict with post_id and status
        """
        try:
            url = "https://open.tiktokapis.com/v1/video/publish/action/upload/"
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            
            data = {
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": 0,  # Would be actual size in production
                },
                "post_info": {
                    "title": content[:150],  # TikTok title limit
                    "description": content,
                    "disable_comment": False,
                    "disable_duet": False,
                    "disable_stitch": False,
                },
            }
            
            response = await self.client.post(url, json=data, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            return {
                "status": "success",
                "platform": "tiktok",
                "post_id": result.get("data", {}).get("video_id"),
                "url": f"https://tiktok.com/@user/video/{result.get('data', {}).get('video_id')}",
            }
        except Exception as e:
            logger.error(f"TikTok posting error: {str(e)}")
            return {
                "status": "failed",
                "platform": "tiktok",
                "error": str(e),
            }

    async def post_to_youtube(
        self,
        access_token: str,
        content: str,
        video_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Post content to YouTube (as comment or community post).
        
        Args:
            access_token: YouTube access token
            content: Post content
            video_id: Optional video ID to comment on
            
        Returns:
            Dict with post_id and status
        """
        try:
            if video_id:
                # Post as comment on video
                url = f"https://www.googleapis.com/youtube/v3/commentThreads"
                
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                }
                
                data = {
                    "snippet": {
                        "videoId": video_id,
                        "textOriginal": content,
                    }
                }
                
                response = await self.client.post(url, json=data, headers=headers)
            else:
                # Post as community post
                url = "https://www.googleapis.com/youtube/v3/activities"
                
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                }
                
                data = {
                    "snippet": {
                        "type": "upload",
                        "groupId": "UGxfYXJlYWN0aW9u",  # Community posts group
                        "textMessageDetails": {
                            "textMessage": content,
                        },
                    }
                }
                
                response = await self.client.post(url, json=data, headers=headers)
            
            response.raise_for_status()
            result = response.json()
            
            return {
                "status": "success",
                "platform": "youtube",
                "post_id": result.get("id"),
                "url": f"https://youtube.com/watch?v={video_id}" if video_id else "https://youtube.com",
            }
        except Exception as e:
            logger.error(f"YouTube posting error: {str(e)}")
            return {
                "status": "failed",
                "platform": "youtube",
                "error": str(e),
            }

    async def post_to_instagram(
        self,
        business_account_id: str,
        access_token: str,
        content: str,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Post content to Instagram.
        
        Args:
            business_account_id: Instagram business account ID
            access_token: Instagram access token
            content: Post caption
            image_url: Optional image URL
            
        Returns:
            Dict with post_id and status
        """
        try:
            # First create media container
            url = f"https://graph.instagram.com/v18.0/{business_account_id}/media"
            
            data = {
                "image_url": image_url or "",
                "caption": content,
                "access_token": access_token,
            }
            
            response = await self.client.post(url, data=data)
            response.raise_for_status()
            
            media_result = response.json()
            media_id = media_result.get("id")
            
            # Then publish the media
            publish_url = f"https://graph.instagram.com/v18.0/{business_account_id}/media_publish"
            publish_data = {
                "creation_id": media_id,
                "access_token": access_token,
            }
            
            publish_response = await self.client.post(publish_url, data=publish_data)
            publish_response.raise_for_status()
            
            publish_result = publish_response.json()
            
            return {
                "status": "success",
                "platform": "instagram",
                "post_id": publish_result.get("id"),
                "url": f"https://instagram.com/p/{publish_result.get('id')}",
            }
        except Exception as e:
            logger.error(f"Instagram posting error: {str(e)}")
            return {
                "status": "failed",
                "platform": "instagram",
                "error": str(e),
            }

    async def post_to_platform(
        self,
        platform: str,
        content: str,
        token: str,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generic method to post to any platform.
        
        Args:
            platform: Platform name (facebook, tiktok, youtube, instagram)
            content: Post content
            token: Access token
            **kwargs: Platform-specific arguments
            
        Returns:
            Dict with post_id and status
        """
        if platform == "facebook":
            return await self.post_to_facebook(
                page_id=kwargs.get("page_id"),
                access_token=token,
                content=content,
                image_url=kwargs.get("image_url"),
            )
        elif platform == "tiktok":
            return await self.post_to_tiktok(
                access_token=token,
                content=content,
                video_url=kwargs.get("video_url"),
            )
        elif platform == "youtube":
            return await self.post_to_youtube(
                access_token=token,
                content=content,
                video_id=kwargs.get("video_id"),
            )
        elif platform == "instagram":
            return await self.post_to_instagram(
                business_account_id=kwargs.get("business_account_id"),
                access_token=token,
                content=content,
                image_url=kwargs.get("image_url"),
            )
        else:
            return {
                "status": "failed",
                "platform": platform,
                "error": f"Unsupported platform: {platform}",
            }

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
_poster = None


def get_platform_poster() -> PlatformPoster:
    """Get or create the platform poster instance."""
    global _poster
    if _poster is None:
        _poster = PlatformPoster()
    return _poster

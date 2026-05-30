from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select, Session

from flowboard.db import get_session
from flowboard.db.models import SocialAccount, ScheduledPost, Asset

router = APIRouter(prefix="/api/social", tags=["social"])


@router.post("/accounts")
def create_social_account(
    platform: str,
    account_id: str,
    access_token: str,
    account_name: Optional[str] = None,
    refresh_token: Optional[str] = None,
) -> dict:
    """Create or update a social media account connection."""
    with get_session() as session:
        # Check if account already exists
        stmt = select(SocialAccount).where(
            (SocialAccount.platform == platform) &
            (SocialAccount.account_id == account_id)
        )
        existing = session.exec(stmt).first()
        
        if existing:
            existing.access_token = access_token
            existing.refresh_token = refresh_token
            existing.account_name = account_name
            existing.updated_at = datetime.utcnow()
            session.add(existing)
        else:
            account = SocialAccount(
                platform=platform,
                account_id=account_id,
                access_token=access_token,
                refresh_token=refresh_token,
                account_name=account_name,
            )
            session.add(account)
        
        session.commit()
        session.refresh(existing or account)
        return {
            "id": (existing or account).id,
            "platform": platform,
            "account_id": account_id,
            "account_name": account_name,
        }


@router.get("/accounts")
def list_social_accounts() -> list:
    """List all connected social media accounts."""
    with get_session() as session:
        stmt = select(SocialAccount)
        accounts = session.exec(stmt).all()
        return [
            {
                "id": acc.id,
                "platform": acc.platform,
                "account_id": acc.account_id,
                "account_name": acc.account_name,
                "created_at": acc.created_at.isoformat(),
            }
            for acc in accounts
        ]


@router.post("/schedule")
def schedule_post(
    asset_id: int,
    social_account_id: int,
    platform: str,
    caption: str,
    scheduled_time: str,  # ISO format datetime
) -> dict:
    """Schedule a post to a social media platform."""
    with get_session() as session:
        # Verify asset exists
        asset = session.get(Asset, asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Verify social account exists
        account = session.get(SocialAccount, social_account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Social account not found")
        
        # Parse scheduled time
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_time)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format")
        
        # Create scheduled post
        post = ScheduledPost(
            asset_id=asset_id,
            social_account_id=social_account_id,
            platform=platform,
            caption=caption,
            scheduled_time=scheduled_dt,
            status="pending",
        )
        session.add(post)
        session.commit()
        session.refresh(post)
        
        return {
            "id": post.id,
            "asset_id": asset_id,
            "platform": platform,
            "scheduled_time": post.scheduled_time.isoformat(),
            "status": "pending",
        }


@router.get("/scheduled-posts")
def list_scheduled_posts(
    status: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
) -> list:
    """List scheduled posts with optional filtering."""
    with get_session() as session:
        stmt = select(ScheduledPost)
        
        if status:
            stmt = stmt.where(ScheduledPost.status == status)
        if platform:
            stmt = stmt.where(ScheduledPost.platform == platform)
        
        posts = session.exec(stmt).all()
        return [
            {
                "id": post.id,
                "asset_id": post.asset_id,
                "platform": post.platform,
                "caption": post.caption,
                "scheduled_time": post.scheduled_time.isoformat(),
                "status": post.status,
                "posted_url": post.posted_url,
                "error_message": post.error_message,
            }
            for post in posts
        ]


@router.delete("/scheduled-posts/{post_id}")
def cancel_scheduled_post(post_id: int) -> dict:
    """Cancel a scheduled post."""
    with get_session() as session:
        post = session.get(ScheduledPost, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Scheduled post not found")
        
        if post.status == "posted":
            raise HTTPException(status_code=400, detail="Cannot cancel a posted item")
        
        post.status = "cancelled"
        session.add(post)
        session.commit()
        
        return {"id": post_id, "status": "cancelled"}

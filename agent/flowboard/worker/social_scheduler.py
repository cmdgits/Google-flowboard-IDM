"""Background scheduler for social media posts.

Runs periodically to check for scheduled posts and upload them to their
respective platforms when the scheduled time arrives.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from flowboard.db import get_session
from flowboard.db.models import ScheduledPost, SocialAccount, Asset

logger = logging.getLogger(__name__)


async def process_scheduled_posts() -> None:
    """Check and process any scheduled posts that are due."""
    with get_session() as session:
        # Find all pending posts that are due (scheduled_time <= now)
        from sqlmodel import select
        
        now = datetime.now(timezone.utc)
        stmt = select(ScheduledPost).where(
            (ScheduledPost.status == "pending") &
            (ScheduledPost.scheduled_time <= now)
        )
        pending_posts = session.exec(stmt).all()
        
        for post in pending_posts:
            try:
                await _upload_post_to_platform(session, post)
            except Exception as e:
                logger.error(f"Failed to upload post {post.id}: {str(e)}")
                post.status = "failed"
                post.error_message = str(e)[:500]
                session.add(post)
        
        if pending_posts:
            session.commit()

        # 2. Find and process all pending SocialBlockPosts that are due
        from flowboard.db.models import SocialBlockPost, SocialBlock
        from flowboard.services.platform_poster import get_platform_poster
        from flowboard.routes.social_block import get_connected_asset_paths
        
        stmt2 = select(SocialBlockPost).where(
            (SocialBlockPost.status == "pending") &
            (SocialBlockPost.scheduled_time <= now)
        )
        pending_block_posts = session.exec(stmt2).all()
        
        if pending_block_posts:
            poster = get_platform_poster()
            for post in pending_block_posts:
                try:
                    # Get associated SocialBlock
                    block = session.get(SocialBlock, post.social_block_id)
                    if not block:
                        raise ValueError(f"Social Block {post.social_block_id} not found")
                        
                    token = None
                    page_id = None
                    business_account_id = None
                    
                    # Get page access token from env or DB
                    import os
                    if post.platform == "facebook" and os.getenv("FB_PAGE__ACCESS_TOKEN"):
                        page_id = os.getenv("FB_PAGE__ID")
                        token = os.getenv("FB_PAGE__ACCESS_TOKEN")
                        
                    if not token:
                        account = session.exec(
                            select(SocialAccount).where(
                                SocialAccount.platform == post.platform
                            )
                        ).first()
                        if account:
                            token = account.access_token
                            page_id = account.account_id if post.platform == "facebook" else None
                            business_account_id = account.account_id if post.platform == "instagram" else None
                            
                    if not token:
                        raise ValueError(f"No credentials configured for {post.platform}")
                        
                    # Get connected media files
                    media_items = get_connected_asset_paths(block.node_id, session)
                    image_path = media_items[0]["path"] if media_items else None
                    
                    post_result = await poster.post_to_platform(
                        platform=post.platform,
                        content=post.content,
                        token=token,
                        page_id=page_id,
                        business_account_id=business_account_id,
                        image_path=image_path,
                        media_items=media_items,
                    )
                    
                    if post_result.get("status") == "success":
                        post.status = "posted"
                        post.posted_url = post_result.get("url")
                        post.posted_at = datetime.now(timezone.utc)
                        
                        if post.platform == "facebook":
                            block.facebook_post_id = post_result.get("post_id")
                            session.add(block)
                    else:
                        post.status = "failed"
                        post.error_message = post_result.get("error", "Unknown error")
                        
                    session.add(post)
                except Exception as e:
                    logger.error(f"Failed to upload social block post {post.id}: {str(e)}")
                    post.status = "failed"
                    post.error_message = str(e)[:500]
                    session.add(post)
                    
            session.commit()


async def _upload_post_to_platform(
    session, post: ScheduledPost
) -> None:
    """Upload a post to its target social media platform.
    
    This is a placeholder that will be expanded with actual API calls
    to Facebook, TikTok, YouTube, etc.
    """
    # Get the asset (video/image)
    asset = session.get(Asset, post.asset_id)
    if not asset:
        raise ValueError(f"Asset {post.asset_id} not found")
    
    # Get the social account
    account = session.get(SocialAccount, post.social_account_id)
    if not account:
        raise ValueError(f"Social account {post.social_account_id} not found")
    
    # Route to the appropriate platform handler
    if post.platform == "facebook":
        await _upload_to_facebook(asset, account, post)
    elif post.platform == "tiktok":
        await _upload_to_tiktok(asset, account, post)
    elif post.platform == "youtube":
        await _upload_to_youtube(asset, account, post)
    elif post.platform == "instagram":
        await _upload_to_instagram(asset, account, post)
    else:
        raise ValueError(f"Unknown platform: {post.platform}")
    
    # Mark as posted
    post.status = "posted"
    post.posted_at = datetime.now(timezone.utc)


async def _upload_to_facebook(
    asset: Asset, account: SocialAccount, post: ScheduledPost
) -> None:
    """Upload video to Facebook.
    
    TODO: Implement actual Facebook Graph API integration.
    Requires: facebook-sdk-python or httpx calls to Graph API.
    """
    logger.info(f"Uploading asset {asset.id} to Facebook page {account.account_id}")
    # Placeholder: In production, use Facebook Graph API
    # POST /v18.0/{page_id}/videos with video file and caption
    post.posted_url = f"https://facebook.com/{account.account_id}/posts/placeholder"


async def _upload_to_tiktok(
    asset: Asset, account: SocialAccount, post: ScheduledPost
) -> None:
    """Upload video to TikTok.
    
    TODO: Implement actual TikTok API integration.
    Requires: TikTok Business API access and video upload endpoint.
    """
    logger.info(f"Uploading asset {asset.id} to TikTok account {account.account_id}")
    # Placeholder: In production, use TikTok API
    # POST /v1/video/upload with video file and caption
    post.posted_url = f"https://tiktok.com/@{account.account_id}/video/placeholder"


async def _upload_to_youtube(
    asset: Asset, account: SocialAccount, post: ScheduledPost
) -> None:
    """Upload video to YouTube.
    
    TODO: Implement actual YouTube API integration.
    Requires: google-auth-oauthlib and youtube-api client.
    """
    logger.info(f"Uploading asset {asset.id} to YouTube channel {account.account_id}")
    # Placeholder: In production, use YouTube Data API v3
    # POST /youtube/v3/videos with video file and metadata
    post.posted_url = f"https://youtube.com/watch?v=placeholder"


async def _upload_to_instagram(
    asset: Asset, account: SocialAccount, post: ScheduledPost
) -> None:
    """Upload image/video to Instagram.
    
    TODO: Implement actual Instagram API integration.
    Requires: Instagram Graph API access (via Facebook).
    """
    logger.info(f"Uploading asset {asset.id} to Instagram account {account.account_id}")
    # Placeholder: In production, use Instagram Graph API
    # POST /v18.0/{ig_user_id}/media with image/video file and caption
    post.posted_url = f"https://instagram.com/p/placeholder"

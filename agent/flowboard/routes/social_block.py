"""Social Block routes for managing social media posting blocks.

Handles CRUD operations for Social Blocks and scheduling posts.
"""
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select, Session

from flowboard.db import get_session
from flowboard.db.models import SocialBlock, SocialBlockPost, Node

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/social-blocks", tags=["social-blocks"])


# ============================================================================
# CREATE
# ============================================================================

@router.post("")
def create_social_block(
    node_id: int,
    board_id: int,
    platforms: List[str] = None,
    content: str = "",
    content_type: str = "manual",
    session: Session = None,
):
    """Create a new Social Block."""
    if session is None:
        session = next(get_session())
    
    try:
        # Verify node exists
        node = session.exec(select(Node).where(Node.id == node_id)).first()
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Create Social Block
        social_block = SocialBlock(
            node_id=node_id,
            board_id=board_id,
            platforms=str(platforms or []),
            content=content,
            content_type=content_type,
            status="draft",
        )
        session.add(social_block)
        session.commit()
        session.refresh(social_block)
        
        return {
            "id": social_block.id,
            "node_id": social_block.node_id,
            "platforms": platforms or [],
            "content": social_block.content,
            "status": social_block.status,
        }
    except Exception as e:
        logger.error(f"Error creating social block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# READ
# ============================================================================

@router.get("/{block_id}")
def get_social_block(block_id: int, session: Session = None):
    """Get a Social Block by ID."""
    if session is None:
        session = next(get_session())
    
    try:
        block = session.exec(
            select(SocialBlock).where(SocialBlock.id == block_id)
        ).first()
        
        if not block:
            raise HTTPException(status_code=404, detail="Social Block not found")
        
        return {
            "id": block.id,
            "node_id": block.node_id,
            "platforms": block.platforms,
            "content": block.content,
            "content_type": block.content_type,
            "status": block.status,
            "scheduled_time": block.scheduled_time,
            "created_at": block.created_at,
        }
    except Exception as e:
        logger.error(f"Error getting social block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def list_social_blocks(
    board_id: int = Query(None),
    status: str = Query(None),
    session: Session = None,
):
    """List Social Blocks with optional filtering."""
    if session is None:
        session = next(get_session())
    
    try:
        query = select(SocialBlock)
        
        if board_id:
            query = query.where(SocialBlock.board_id == board_id)
        if status:
            query = query.where(SocialBlock.status == status)
        
        blocks = session.exec(query).all()
        
        return [
            {
                "id": block.id,
                "node_id": block.node_id,
                "platforms": block.platforms,
                "content": block.content[:100] + "..." if len(block.content) > 100 else block.content,
                "status": block.status,
                "created_at": block.created_at,
            }
            for block in blocks
        ]
    except Exception as e:
        logger.error(f"Error listing social blocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# UPDATE
# ============================================================================

@router.put("/{block_id}")
def update_social_block(
    block_id: int,
    platforms: List[str] = None,
    content: str = None,
    content_type: str = None,
    ai_prompt: str = None,
    session: Session = None,
):
    """Update a Social Block."""
    if session is None:
        session = next(get_session())
    
    try:
        block = session.exec(
            select(SocialBlock).where(SocialBlock.id == block_id)
        ).first()
        
        if not block:
            raise HTTPException(status_code=404, detail="Social Block not found")
        
        # Update fields
        if platforms is not None:
            block.platforms = str(platforms)
        if content is not None:
            block.content = content
        if content_type is not None:
            block.content_type = content_type
        if ai_prompt is not None:
            block.ai_prompt = ai_prompt
        
        block.updated_at = datetime.utcnow()
        
        session.add(block)
        session.commit()
        session.refresh(block)
        
        return {
            "id": block.id,
            "platforms": platforms or [],
            "content": block.content,
            "status": block.status,
            "updated_at": block.updated_at,
        }
    except Exception as e:
        logger.error(f"Error updating social block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SCHEDULE
# ============================================================================

@router.post("/{block_id}/schedule")
def schedule_social_block(
    block_id: int,
    platforms: List[str],
    scheduled_time: datetime,
    is_recurring: bool = False,
    recurrence_pattern: str = None,
    session: Session = None,
):
    """Schedule a Social Block to post to platforms."""
    if session is None:
        session = next(get_session())
    
    try:
        block = session.exec(
            select(SocialBlock).where(SocialBlock.id == block_id)
        ).first()
        
        if not block:
            raise HTTPException(status_code=404, detail="Social Block not found")
        
        # Validate scheduled time is in future
        if scheduled_time <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future")
        
        # Update block
        block.platforms = str(platforms)
        block.scheduled_time = scheduled_time
        block.is_recurring = is_recurring
        block.recurrence_pattern = recurrence_pattern
        block.status = "scheduled"
        block.updated_at = datetime.utcnow()
        
        session.add(block)
        session.commit()
        
        # Create SocialBlockPost entries for each platform
        for platform in platforms:
            post = SocialBlockPost(
                social_block_id=block.id,
                platform=platform,
                content=block.content,
                scheduled_time=scheduled_time,
                status="pending",
            )
            session.add(post)
        
        session.commit()
        
        return {
            "id": block.id,
            "status": "scheduled",
            "platforms": platforms,
            "scheduled_time": scheduled_time,
            "posts_created": len(platforms),
        }
    except Exception as e:
        logger.error(f"Error scheduling social block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STATUS
# ============================================================================

@router.get("/{block_id}/status")
def get_social_block_status(block_id: int, session: Session = None):
    """Get status of a Social Block and its posts."""
    if session is None:
        session = next(get_session())
    
    try:
        block = session.exec(
            select(SocialBlock).where(SocialBlock.id == block_id)
        ).first()
        
        if not block:
            raise HTTPException(status_code=404, detail="Social Block not found")
        
        # Get posts
        posts = session.exec(
            select(SocialBlockPost).where(SocialBlockPost.social_block_id == block_id)
        ).all()
        
        return {
            "id": block.id,
            "status": block.status,
            "scheduled_time": block.scheduled_time,
            "posts": [
                {
                    "id": post.id,
                    "platform": post.platform,
                    "status": post.status,
                    "posted_url": post.posted_url,
                    "error_message": post.error_message,
                    "posted_at": post.posted_at,
                }
                for post in posts
            ],
        }
    except Exception as e:
        logger.error(f"Error getting social block status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DELETE
# ============================================================================

@router.delete("/{block_id}")
def delete_social_block(block_id: int, session: Session = None):
    """Delete a Social Block."""
    if session is None:
        session = next(get_session())
    
    try:
        block = session.exec(
            select(SocialBlock).where(SocialBlock.id == block_id)
        ).first()
        
        if not block:
            raise HTTPException(status_code=404, detail="Social Block not found")
        
        # Delete associated posts
        posts = session.exec(
            select(SocialBlockPost).where(SocialBlockPost.social_block_id == block_id)
        ).all()
        
        for post in posts:
            session.delete(post)
        
        session.delete(block)
        session.commit()
        
        return {"message": "Social Block deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting social block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

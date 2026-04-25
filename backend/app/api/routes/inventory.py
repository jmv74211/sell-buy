from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, security

router = APIRouter(
    prefix="/api/inventory",
    tags=["inventory"],
)


# Platform Ranges endpoints
@router.get("/platforms", response_model=List[schemas.PlatformRangeResponse])
def get_platforms(db: Session = Depends(get_db)):
    """Get all platform ranges"""
    platforms = db.query(models.PlatformRange).all()
    return platforms


@router.post("/platforms", response_model=schemas.PlatformRangeResponse)
def create_platform(
    platform: schemas.PlatformRangeCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new platform range - Admin only"""
    # Check if platform already exists
    existing = db.query(models.PlatformRange).filter(
        models.PlatformRange.platform_name == platform.platform_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Platform already exists")

    db_platform = models.PlatformRange(**platform.dict())
    db.add(db_platform)
    db.commit()
    db.refresh(db_platform)
    return db_platform


@router.get("/platforms/{platform_id}", response_model=schemas.PlatformRangeResponse)
def get_platform(platform_id: int, db: Session = Depends(get_db)):
    """Get a specific platform range"""
    platform = db.query(models.PlatformRange).filter(
        models.PlatformRange.id == platform_id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    return platform


# Articles endpoints
@router.get("/articles", response_model=List[schemas.ArticleResponse])
def get_articles(db: Session = Depends(get_db)):
    """Get all articles"""
    articles = db.query(models.Article).all()
    return articles


@router.get("/articles/code/{article_code}", response_model=schemas.ArticleResponse)
def get_article_by_code(article_code: int, db: Session = Depends(get_db)):
    """Get an article by its code"""
    article = db.query(models.Article).filter(
        models.Article.article_code == article_code
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.get("/articles/platform/{platform_id}", response_model=List[schemas.ArticleResponse])
def get_articles_by_platform(platform_id: int, db: Session = Depends(get_db)):
    """Get all articles for a specific platform"""
    platform = db.query(models.PlatformRange).filter(
        models.PlatformRange.id == platform_id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    articles = db.query(models.Article).filter(
        models.Article.platform_id == platform_id
    ).all()
    return articles


@router.post("/articles", response_model=schemas.ArticleResponse)
def create_article(
    article: schemas.ArticleCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new article - Admin only"""
    # Check if article_code already exists
    existing = db.query(models.Article).filter(
        models.Article.article_code == article.article_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Article code already exists")

    # Verify platform exists
    platform = db.query(models.PlatformRange).filter(
        models.PlatformRange.id == article.platform_id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    db_article = models.Article(**article.dict())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article


@router.post("/articles/bulk", response_model=List[schemas.ArticleResponse])
def create_articles_bulk(
    articles_list: List[schemas.ArticleCreate],
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Create multiple articles at once - Admin only"""
    created_articles = []

    for article in articles_list:
        # Check if article_code already exists
        existing = db.query(models.Article).filter(
            models.Article.article_code == article.article_code
        ).first()
        if existing:
            continue

        # Verify platform exists
        platform = db.query(models.PlatformRange).filter(
            models.PlatformRange.id == article.platform_id
        ).first()
        if not platform:
            continue

        db_article = models.Article(**article.dict())
        db.add(db_article)
        created_articles.append(db_article)

    db.commit()
    for article in created_articles:
        db.refresh(article)
    return created_articles


@router.put("/articles/{article_code}", response_model=schemas.ArticleResponse)
def update_article(
    article_code: int,
    article: schemas.ArticleCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Update an article - Admin only"""
    db_article = db.query(models.Article).filter(
        models.Article.article_code == article_code
    ).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Verify platform exists
    platform = db.query(models.PlatformRange).filter(
        models.PlatformRange.id == article.platform_id
    ).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    for key, value in article.dict().items():
        if key != "article_code":  # Don't allow changing the code
            setattr(db_article, key, value)

    db.commit()
    db.refresh(db_article)
    return db_article


@router.delete("/articles/{article_code}")
def delete_article(
    article_code: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an article - Admin only"""
    db_article = db.query(models.Article).filter(
        models.Article.article_code == article_code
    ).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.delete(db_article)
    db.commit()
    return {"detail": "Article deleted"}

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class PlatformRange(Base):
    __tablename__ = "platform_ranges"

    id = Column(Integer, primary_key=True, index=True)
    platform_name = Column(String(100), unique=True, nullable=False, index=True)
    code_range = Column(Integer, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    articles = relationship("Article", back_populates="platform")


class Article(Base):
    __tablename__ = "articles"

    article_code = Column(Integer, primary_key=True, index=True)
    article_name = Column(String(255), nullable=False)
    platform_id = Column(Integer, ForeignKey("platform_ranges.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    platform = relationship("PlatformRange", back_populates="articles")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    active = Column(Boolean, default=True)
    first_login_date = Column(DateTime, nullable=True)
    last_login_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    purchases = relationship("Purchase", back_populates="owner")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_name = Column(String(255), nullable=False)
    article_code = Column(Integer, nullable=True)  # Optional reference to article, no FK for safety
    purchase_date = Column(DateTime, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="purchases")
    sales = relationship("Sale", back_populates="purchase", cascade="all, delete-orphan")
    estimation = relationship("Estimation", back_populates="purchase", uselist=False, cascade="all, delete-orphan")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    sale_date = Column(DateTime, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    purchase = relationship("Purchase", back_populates="sales")
    estimation = relationship("Estimation", back_populates="sale", uselist=False, cascade="all, delete-orphan")

class Estimation(Base):
    __tablename__ = "estimations"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), unique=True, nullable=False)
    sale_id = Column(Integer, ForeignKey("sales.id"), unique=True, nullable=True)
    estimated_profit = Column(Numeric(10, 2), nullable=False)
    estimated_sale_price = Column(Numeric(10, 2), nullable=True)
    actual_profit = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    purchase = relationship("Purchase", back_populates="estimation")
    sale = relationship("Sale", back_populates="estimation")

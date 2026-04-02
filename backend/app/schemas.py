from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

# User Schemas
class UserBase(BaseModel):
    user_name: str
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    active: bool
    first_login_date: Optional[datetime]
    last_login_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# Platform Schemas
class PlatformBase(BaseModel):
    name: str
    url: Optional[str] = None

class PlatformCreate(PlatformBase):
    pass

class PlatformResponse(PlatformBase):
    id: int

    class Config:
        from_attributes = True

# Purchase Schemas
class PurchaseBase(BaseModel):
    article_name: str
    purchase_date: date
    amount: Decimal
    item_condition: int
    platform_id: Optional[int] = None

class PurchaseCreate(PurchaseBase):
    pass

class PurchaseResponse(BaseModel):
    id: int
    user_id: int
    article_name: str
    purchase_date: datetime
    amount: float
    item_condition: int
    platform_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Sale Schemas
class SaleBase(BaseModel):
    purchase_id: int
    sale_date: date
    amount: Decimal

class SaleCreate(SaleBase):
    pass

class SaleResponse(BaseModel):
    id: int
    purchase_id: int
    sale_date: datetime
    amount: float
    created_at: datetime

    class Config:
        from_attributes = True

# Estimation Schemas
class EstimationBase(BaseModel):
    purchase_id: int
    sale_id: Optional[int] = None
    estimated_profit: Decimal
    estimated_sale_price: Optional[Decimal] = None
    actual_profit: Optional[Decimal] = None

class EstimationCreate(EstimationBase):
    pass

class EstimationResponse(BaseModel):
    id: int
    purchase_id: int
    sale_id: Optional[int] = None
    estimated_profit: float
    estimated_sale_price: Optional[float] = None
    actual_profit: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class LoginRequest(BaseModel):
    user_name: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None

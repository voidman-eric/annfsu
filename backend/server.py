from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import os
import logging
from pathlib import Path
from bson import ObjectId
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
OTP_EXPIRE_MINUTES = 10

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========== MODELS ==========

class UserRole:
    PUBLIC = "public"
    MEMBER = "member"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class UserStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Request Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    address: str
    institution: str
    committee: str
    position: Optional[str] = None
    blood_group: Optional[str] = None
    photo: Optional[str] = None

class EmailPasswordLogin(BaseModel):
    email: EmailStr
    password: str

class PhoneOTPRequest(BaseModel):
    phone: str

class PhoneOTPVerify(BaseModel):
    phone: str
    otp: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    address: str
    institution: str
    committee: str
    position: Optional[str] = None
    blood_group: Optional[str] = None
    photo: Optional[str] = None
    role: str
    status: str
    membership_id: Optional[str] = None
    issue_date: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ContentCreate(BaseModel):
    type: str
    title_ne: str
    content_ne: str
    images: Optional[List[str]] = []

class ContentUpdate(BaseModel):
    title_ne: Optional[str] = None
    content_ne: Optional[str] = None
    images: Optional[List[str]] = None

class ContentResponse(BaseModel):
    id: str
    type: str
    title_ne: str
    content_ne: str
    images: List[str]
    author_id: str
    created_at: str
    updated_at: str

class SongCreate(BaseModel):
    title_ne: str
    category: str
    audio_data: str
    duration: Optional[str] = "00:00"

class SongResponse(BaseModel):
    id: str
    title_ne: str
    category: str
    duration: str
    uploaded_by: str
    created_at: str

class ContactCreate(BaseModel):
    name_ne: str
    designation_ne: str
    phone_number: str
    committee: str
    order: Optional[int] = 0

class ContactUpdate(BaseModel):
    name_ne: Optional[str] = None
    designation_ne: Optional[str] = None
    phone_number: Optional[str] = None
    committee: Optional[str] = None
    order: Optional[int] = None

class ContactResponse(BaseModel):
    id: str
    name_ne: str
    designation_ne: str
    phone_number: str
    committee: str
    order: int
    created_at: str

class MemberUpdate(BaseModel):
    status: Optional[str] = None
    role: Optional[str] = None
    position: Optional[str] = None

class AdminActivityResponse(BaseModel):
    id: str
    admin_id: str
    admin_name: str
    action: str
    target_type: str
    target_id: str
    details: Dict[str, Any]
    timestamp: str

class DashboardStats(BaseModel):
    total_members: int
    pending_requests: int
    approved_members: int
    rejected_members: int
    total_content: int
    total_songs: int
    total_contacts: int

# ========== HELPER FUNCTIONS ==========

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

async def send_sms(phone: str, message: str):
    """Mock SMS service - replace with actual SMS provider"""
    logger.info(f"SMS to {phone}: {message}")
    # TODO: Integrate with actual SMS provider (Twilio, etc.)
    return True

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

async def require_approved_member(current_user: dict = Depends(get_current_user)):
    if current_user["status"] != UserStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership not approved")
    return current_user

async def log_admin_activity(admin_id: str, admin_name: str, action: str, target_type: str, target_id: str, details: Dict[str, Any]):
    """Log admin activities for audit trail"""
    activity = {
        "admin_id": admin_id,
        "admin_name": admin_name,
        "action": action,  # create, update, delete, approve, reject
        "target_type": target_type,  # member, content, song, contact
        "target_id": target_id,
        "details": details,
        "timestamp": datetime.utcnow()
    }
    await db.admin_activities.insert_one(activity)
    logger.info(f"Admin activity logged: {action} on {target_type} by {admin_name}")

def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        phone=user["phone"],
        address=user["address"],
        institution=user["institution"],
        committee=user["committee"],
        position=user.get("position"),
        blood_group=user.get("blood_group"),
        photo=user.get("photo"),
        role=user["role"],
        status=user["status"],
        membership_id=user.get("membership_id"),
        issue_date=user.get("issue_date"),
        created_at=user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"]
    )

# ========== AUTHENTICATION ROUTES ==========

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    """Public sign-up - creates user with Public role"""
    # Check if email or phone already exists
    existing = await db.users.find_one({
        "$or": [{"email": user_data.email}, {"phone": user_data.phone}]
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or phone already registered")
    
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_data.password)
    user_dict["role"] = UserRole.PUBLIC  # Public role for sign-up
    user_dict["status"] = UserStatus.PENDING  # Pending until they apply for membership
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    user_dict["membership_id"] = None
    user_dict["issue_date"] = None
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Auto-login after sign-up
    access_token = create_access_token({"sub": str(result.inserted_id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_to_response(user_dict)
    )

@api_router.post("/auth/login/email", response_model=TokenResponse)
async def login_with_email(login_data: EmailPasswordLogin):
    """Login with email and password"""
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_to_response(user)
    )

@api_router.post("/auth/request-otp")
async def request_otp(otp_request: PhoneOTPRequest):
    """Request OTP for phone login"""
    # Check if user exists with this phone
    user = await db.users.find_one({"phone": otp_request.phone})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Phone number not registered")
    
    # Generate OTP
    otp = generate_otp()
    expire_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    
    # Store OTP in database
    await db.otp_codes.update_one(
        {"phone": otp_request.phone},
        {
            "$set": {
                "phone": otp_request.phone,
                "otp": otp,
                "expire_at": expire_at,
                "used": False,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Send SMS (mock)
    await send_sms(otp_request.phone, f"Your ANNFSU OTP is: {otp}")
    
    return {"message": "OTP sent successfully", "expires_in_minutes": OTP_EXPIRE_MINUTES}

@api_router.post("/auth/verify-otp", response_model=TokenResponse)
async def verify_otp(otp_verify: PhoneOTPVerify):
    """Verify OTP and login"""
    # Find OTP record
    otp_record = await db.otp_codes.find_one({
        "phone": otp_verify.phone,
        "otp": otp_verify.otp,
        "used": False
    })
    
    if not otp_record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
    
    # Check if expired
    if otp_record["expire_at"] < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP expired")
    
    # Mark OTP as used
    await db.otp_codes.update_one(
        {"_id": otp_record["_id"]},
        {"$set": {"used": True}}
    )
    
    # Get user
    user = await db.users.find_one({"phone": otp_verify.phone})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Create token
    access_token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_to_response(user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_to_response(current_user)

# ========== MEMBER MANAGEMENT ROUTES ==========

@api_router.post("/members", response_model=UserResponse)
async def create_member(user_data: UserCreate, admin: dict = Depends(require_admin)):
    """Admin creates a new member - starts as PENDING"""
    # Check if email or phone already exists
    existing = await db.users.find_one({
        "$or": [{"email": user_data.email}, {"phone": user_data.phone}]
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or phone already registered")
    
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_data.password)
    user_dict["role"] = UserRole.MEMBER
    user_dict["status"] = UserStatus.PENDING  # Always start as pending
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    user_dict["membership_id"] = None  # Will be generated on approval
    user_dict["issue_date"] = None
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "create",
        "member",
        str(result.inserted_id),
        {"member_name": user_data.full_name, "status": "pending"}
    )
    
    return user_to_response(user_dict)

@api_router.post("/membership/apply", response_model=UserResponse)
async def apply_for_membership(current_user: dict = Depends(get_current_user)):
    """Public user applies for membership - upgrades to Member role with Pending status"""
    user_id = str(current_user["_id"])
    
    # Check if already a member
    if current_user["role"] == UserRole.MEMBER:
        if current_user["status"] == UserStatus.APPROVED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already an approved member")
        elif current_user["status"] == UserStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application already submitted")
    
    # Upgrade from Public to Member (Pending)
    update_dict = {
        "role": UserRole.MEMBER,
        "status": UserStatus.PENDING,
        "updated_at": datetime.utcnow()
    }
    
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_dict})
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return user_to_response(updated_user)

@api_router.get("/members", response_model=List[UserResponse])
async def get_members(
    admin: dict = Depends(require_admin),
    status_filter: Optional[str] = None,
    committee_filter: Optional[str] = None
):
    """Get all members with optional filters"""
    query = {}
    if status_filter:
        query["status"] = status_filter
    if committee_filter:
        query["committee"] = committee_filter
    
    users = await db.users.find(query).sort("created_at", -1).to_list(1000)
    return [user_to_response(user) for user in users]

@api_router.get("/members/{member_id}", response_model=UserResponse)
async def get_member(member_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific member details"""
    user = await db.users.find_one({"_id": ObjectId(member_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return user_to_response(user)

@api_router.put("/members/{member_id}/approve", response_model=UserResponse)
async def approve_member(member_id: str, admin: dict = Depends(require_admin)):
    """Approve a pending member and generate membership card"""
    user = await db.users.find_one({"_id": ObjectId(member_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    # Generate membership ID
    count = await db.users.count_documents({"status": UserStatus.APPROVED}) + 1
    membership_id = f"ANNFSU-{count:05d}"
    
    update_dict = {
        "status": UserStatus.APPROVED,
        "membership_id": membership_id,
        "issue_date": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.update_one({"_id": ObjectId(member_id)}, {"$set": update_dict})
    updated_user = await db.users.find_one({"_id": ObjectId(member_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "approve",
        "member",
        member_id,
        {"member_name": user["full_name"], "membership_id": membership_id}
    )
    
    return user_to_response(updated_user)

@api_router.put("/members/{member_id}/reject", response_model=UserResponse)
async def reject_member(member_id: str, admin: dict = Depends(require_admin)):
    """Reject a pending member"""
    user = await db.users.find_one({"_id": ObjectId(member_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    await db.users.update_one(
        {"_id": ObjectId(member_id)},
        {"$set": {"status": UserStatus.REJECTED, "updated_at": datetime.utcnow()}}
    )
    updated_user = await db.users.find_one({"_id": ObjectId(member_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "reject",
        "member",
        member_id,
        {"member_name": user["full_name"]}
    )
    
    return user_to_response(updated_user)

@api_router.put("/members/{member_id}", response_model=UserResponse)
async def update_member(member_id: str, update_data: MemberUpdate, admin: dict = Depends(require_admin)):
    """Update member details"""
    user = await db.users.find_one({"_id": ObjectId(member_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.users.update_one({"_id": ObjectId(member_id)}, {"$set": update_dict})
    updated_user = await db.users.find_one({"_id": ObjectId(member_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "update",
        "member",
        member_id,
        {"member_name": user["full_name"], "changes": update_dict}
    )
    
    return user_to_response(updated_user)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    address: Optional[str] = None
    institution: Optional[str] = None
    committee: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    photo: Optional[str] = None

@api_router.put("/profile/update", response_model=UserResponse)
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """User updates their own profile"""
    user_id = str(current_user["_id"])
    
    update_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_dict})
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return user_to_response(updated_user)

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, admin: dict = Depends(require_admin)):
    """Delete a member"""
    user = await db.users.find_one({"_id": ObjectId(member_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    
    result = await db.users.delete_one({"_id": ObjectId(member_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "delete",
        "member",
        member_id,
        {"member_name": user["full_name"]}
    )
    
    return {"message": "Member deleted successfully"}

# ========== CONTENT ROUTES ==========

@api_router.post("/content", response_model=ContentResponse)
async def create_content(content_data: ContentCreate, admin: dict = Depends(require_admin)):
    """Create new content"""
    content_dict = content_data.dict()
    content_dict["author_id"] = str(admin["_id"])
    content_dict["created_at"] = datetime.utcnow()
    content_dict["updated_at"] = datetime.utcnow()
    
    result = await db.content.insert_one(content_dict)
    content_dict["_id"] = result.inserted_id
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "create",
        "content",
        str(result.inserted_id),
        {"type": content_data.type, "title": content_data.title_ne}
    )
    
    return ContentResponse(
        id=str(content_dict["_id"]),
        type=content_dict["type"],
        title_ne=content_dict["title_ne"],
        content_ne=content_dict["content_ne"],
        images=content_dict["images"],
        author_id=content_dict["author_id"],
        created_at=content_dict["created_at"].isoformat(),
        updated_at=content_dict["updated_at"].isoformat()
    )

@api_router.get("/content/{content_type}", response_model=List[ContentResponse])
async def get_content_by_type(content_type: str):
    """Get content by type - public access"""
    contents = await db.content.find({"type": content_type}).sort("created_at", -1).to_list(1000)
    return [
        ContentResponse(
            id=str(content["_id"]),
            type=content["type"],
            title_ne=content["title_ne"],
            content_ne=content["content_ne"],
            images=content.get("images", []),
            author_id=content["author_id"],
            created_at=content["created_at"].isoformat() if isinstance(content["created_at"], datetime) else content["created_at"],
            updated_at=content["updated_at"].isoformat() if isinstance(content["updated_at"], datetime) else content["updated_at"]
        )
        for content in contents
    ]

@api_router.put("/content/{content_id}", response_model=ContentResponse)
async def update_content(content_id: str, content_data: ContentUpdate, admin: dict = Depends(require_admin)):
    """Update content"""
    content = await db.content.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    
    update_dict = {k: v for k, v in content_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.content.update_one({"_id": ObjectId(content_id)}, {"$set": update_dict})
    updated_content = await db.content.find_one({"_id": ObjectId(content_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "update",
        "content",
        content_id,
        {"type": content["type"], "title": content["title_ne"]}
    )
    
    return ContentResponse(
        id=str(updated_content["_id"]),
        type=updated_content["type"],
        title_ne=updated_content["title_ne"],
        content_ne=updated_content["content_ne"],
        images=updated_content.get("images", []),
        author_id=updated_content["author_id"],
        created_at=updated_content["created_at"].isoformat() if isinstance(updated_content["created_at"], datetime) else updated_content["created_at"],
        updated_at=updated_content["updated_at"].isoformat() if isinstance(updated_content["updated_at"], datetime) else updated_content["updated_at"]
    )

@api_router.delete("/content/{content_id}")
async def delete_content(content_id: str, admin: dict = Depends(require_admin)):
    """Delete content"""
    content = await db.content.find_one({"_id": ObjectId(content_id)})
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    
    await db.content.delete_one({"_id": ObjectId(content_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "delete",
        "content",
        content_id,
        {"type": content["type"], "title": content["title_ne"]}
    )
    
    return {"message": "Content deleted successfully"}

# ========== SONG ROUTES (keeping existing) ==========

@api_router.post("/songs", response_model=SongResponse)
async def create_song(song_data: SongCreate, admin: dict = Depends(require_admin)):
    """Upload song"""
    song_dict = song_data.dict()
    song_dict["uploaded_by"] = str(admin["_id"])
    song_dict["created_at"] = datetime.utcnow()
    
    result = await db.songs.insert_one(song_dict)
    song_dict["_id"] = result.inserted_id
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "create",
        "song",
        str(result.inserted_id),
        {"title": song_data.title_ne}
    )
    
    return SongResponse(
        id=str(song_dict["_id"]),
        title_ne=song_dict["title_ne"],
        category=song_dict["category"],
        duration=song_dict["duration"],
        uploaded_by=song_dict["uploaded_by"],
        created_at=song_dict["created_at"].isoformat()
    )

@api_router.get("/songs", response_model=List[SongResponse])
async def get_songs():
    """Get all songs - public access"""
    songs = await db.songs.find().to_list(1000)
    return [
        SongResponse(
            id=str(song["_id"]),
            title_ne=song["title_ne"],
            category=song["category"],
            duration=song.get("duration", "00:00"),
            uploaded_by=song["uploaded_by"],
            created_at=song["created_at"].isoformat() if isinstance(song["created_at"], datetime) else song["created_at"]
        )
        for song in songs
    ]

@api_router.get("/songs/{song_id}/audio")
async def get_song_audio(song_id: str):
    """Get song audio data"""
    song = await db.songs.find_one({"_id": ObjectId(song_id)})
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    return {"audio_data": song["audio_data"]}

@api_router.delete("/songs/{song_id}")
async def delete_song(song_id: str, admin: dict = Depends(require_admin)):
    """Delete song"""
    song = await db.songs.find_one({"_id": ObjectId(song_id)})
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    
    await db.songs.delete_one({"_id": ObjectId(song_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "delete",
        "song",
        song_id,
        {"title": song["title_ne"]}
    )
    
    return {"message": "Song deleted successfully"}

# ========== CONTACT ROUTES ==========

@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(contact_data: ContactCreate, admin: dict = Depends(require_admin)):
    """Create contact"""
    contact_dict = contact_data.dict()
    contact_dict["created_at"] = datetime.utcnow()
    
    result = await db.contacts.insert_one(contact_dict)
    contact_dict["_id"] = result.inserted_id
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "create",
        "contact",
        str(result.inserted_id),
        {"name": contact_data.name_ne}
    )
    
    return ContactResponse(
        id=str(contact_dict["_id"]),
        name_ne=contact_dict["name_ne"],
        designation_ne=contact_dict["designation_ne"],
        phone_number=contact_dict["phone_number"],
        committee=contact_dict["committee"],
        order=contact_dict["order"],
        created_at=contact_dict["created_at"].isoformat()
    )

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(committee: Optional[str] = None):
    """Get contacts - public access"""
    query = {}
    if committee:
        query["committee"] = committee
    
    contacts = await db.contacts.find(query).sort("order", 1).to_list(1000)
    return [
        ContactResponse(
            id=str(contact["_id"]),
            name_ne=contact["name_ne"],
            designation_ne=contact["designation_ne"],
            phone_number=contact["phone_number"],
            committee=contact["committee"],
            order=contact.get("order", 0),
            created_at=contact["created_at"].isoformat() if isinstance(contact["created_at"], datetime) else contact["created_at"]
        )
        for contact in contacts
    ]

@api_router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: str, contact_data: ContactUpdate, admin: dict = Depends(require_admin)):
    """Update contact"""
    contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    
    update_dict = {k: v for k, v in contact_data.dict().items() if v is not None}
    await db.contacts.update_one({"_id": ObjectId(contact_id)}, {"$set": update_dict})
    updated_contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "update",
        "contact",
        contact_id,
        {"name": contact["name_ne"]}
    )
    
    return ContactResponse(
        id=str(updated_contact["_id"]),
        name_ne=updated_contact["name_ne"],
        designation_ne=updated_contact["designation_ne"],
        phone_number=updated_contact["phone_number"],
        committee=updated_contact["committee"],
        order=updated_contact.get("order", 0),
        created_at=updated_contact["created_at"].isoformat() if isinstance(updated_contact["created_at"], datetime) else updated_contact["created_at"]
    )

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, admin: dict = Depends(require_admin)):
    """Delete contact"""
    contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    
    await db.contacts.delete_one({"_id": ObjectId(contact_id)})
    
    # Log activity
    await log_admin_activity(
        str(admin["_id"]),
        admin["full_name"],
        "delete",
        "contact",
        contact_id,
        {"name": contact["name_ne"]}
    )
    
    return {"message": "Contact deleted successfully"}

# ========== ADMIN DASHBOARD ROUTES ==========

@api_router.get("/admin/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin: dict = Depends(require_admin)):
    """Get dashboard statistics"""
    total_members = await db.users.count_documents({"role": UserRole.MEMBER})
    pending_requests = await db.users.count_documents({"status": UserStatus.PENDING})
    approved_members = await db.users.count_documents({"status": UserStatus.APPROVED})
    rejected_members = await db.users.count_documents({"status": UserStatus.REJECTED})
    total_content = await db.content.count_documents({})
    total_songs = await db.songs.count_documents({})
    total_contacts = await db.contacts.count_documents({})
    
    return DashboardStats(
        total_members=total_members,
        pending_requests=pending_requests,
        approved_members=approved_members,
        rejected_members=rejected_members,
        total_content=total_content,
        total_songs=total_songs,
        total_contacts=total_contacts
    )

@api_router.get("/admin/activities", response_model=List[AdminActivityResponse])
async def get_admin_activities(admin: dict = Depends(require_admin), limit: int = 50):
    """Get admin activity log"""
    activities = await db.admin_activities.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return [
        AdminActivityResponse(
            id=str(activity["_id"]),
            admin_id=activity["admin_id"],
            admin_name=activity["admin_name"],
            action=activity["action"],
            target_type=activity["target_type"],
            target_id=activity["target_id"],
            details=activity["details"],
            timestamp=activity["timestamp"].isoformat()
        )
        for activity in activities
    ]

# ========== UTILITY ROUTES ==========

@api_router.get("/")
async def root():
    return {"message": "ANNFSU API - अखिल नेपाल राष्ट्रिय स्वतन्त्र विद्यार्थी युनियन", "version": "2.0"}

@api_router.post("/seed-admin")
async def seed_admin():
    """Create a default admin user for testing"""
    existing_admin = await db.users.find_one({"email": "admin@annfsu.org"})
    if existing_admin:
        return {"message": "Admin already exists"}
    
    admin_user = {
        "email": "admin@annfsu.org",
        "password": hash_password("admin123"),
        "full_name": "Admin User",
        "phone": "9851234567",
        "address": "Kathmandu, Nepal",
        "institution": "ANNFSU Central Office",
        "committee": "central",
        "position": "System Administrator",
        "blood_group": "O+",
        "photo": "",
        "role": UserRole.SUPER_ADMIN,
        "status": UserStatus.APPROVED,
        "membership_id": "ANNFSU-00001",
        "issue_date": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(admin_user)
    return {"message": "Admin user created", "email": "admin@annfsu.org", "password": "admin123"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

"""Pydantic schemas for MOI website scraped data."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class MoiWebRecord(BaseModel):
    """Raw record scraped from religion.moi.gov.tw search results."""

    name: str = Field(description="Temple/organization name")
    religion_raw: str = Field(description="Raw religion string, e.g. '道教'")
    deity_name: str = Field(default="", description="Primary deity, e.g. '天上聖母'")
    district: str = Field(description="District, e.g. '旗津區'")
    address: str = Field(description="Full address including city")
    phone: str = Field(default="")
    responsible_person: str = Field(default="")
    registration_type: str = Field(default="", description="登記別: 正式登記/補辦登記")
    unified_number: str = Field(default="", description="統一編號")
    last_updated: str = Field(default="", description="Last update date, e.g. '2025/02/17'")
    source_primary: str = Field(default="moi_web")


class MoiWebNormalized(BaseModel):
    """Normalized record ready for merge pipeline."""

    name: str
    religion_type: str = Field(
        description="Mapped enum: taoism|buddhism|christianity|catholicism|islam|folk|other"
    )
    deity_name: str = Field(default="")
    district: str = Field(description="District only, e.g. '旗津區'")
    address: str = Field(description="Full address")
    phone: str = Field(default="")
    built_year: Optional[int] = Field(default=None)
    source_primary: str = Field(default="moi_web")

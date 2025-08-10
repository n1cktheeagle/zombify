from __future__ import annotations

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    image_url: str = Field(..., description="Signed URL or public URL to the image to analyze")
    target_width: int = Field(1440, description="Target width to resize image to, maintaining aspect ratio")
    modes: List[Literal["ocr", "geometry", "contrast", "palette"]] = Field(
        default_factory=lambda: ["ocr", "geometry", "contrast", "palette"],
        description="Which subsystems to run"
    )


class ImageInfo(BaseModel):
    w: int
    h: int
    hash: str


class TextItem(BaseModel):
    id: str
    text: str
    bbox: List[int]  # [x,y,w,h]
    conf: float
    approxSizePx: int


class ContrastItem(BaseModel):
    id: str
    textId: str
    ratio: float
    wcag: Literal["PASS", "WARN", "FAIL"]


class BlockItem(BaseModel):
    id: str
    bbox: List[int]
    kind: Literal["section", "card", "unknown"]


class GridInfo(BaseModel):
    cols: int
    gutterPx: int
    confidence: float


class ButtonItem(BaseModel):
    id: str
    bbox: List[int]
    cornerRadius: int
    hasCenterText: bool
    textId: Optional[str] = None


class PaletteInfo(BaseModel):
    dominant: List[str]
    mode: Literal["dark", "light"]


class MetricsInfo(BaseModel):
    medianVSpace: int
    leftEdgeVariancePx: float


class SourceInfo(BaseModel):
    ocr: str
    cv: str


class AnalyzeResponse(BaseModel):
    version: str
    image: ImageInfo
    texts: List[TextItem]
    contrast: List[ContrastItem]
    blocks: List[BlockItem]
    grid: GridInfo | None
    buttons: List[ButtonItem]
    palette: PaletteInfo | None
    metrics: MetricsInfo | None
    source: SourceInfo

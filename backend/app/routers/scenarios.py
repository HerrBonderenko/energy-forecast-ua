from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from app.services.db import (
    save_scenario, get_scenarios, get_scenario_by_id,
    delete_scenario as db_delete_scenario,
    duplicate_scenario as db_duplicate_scenario,
)

router = APIRouter()


class ScenarioDeltas(BaseModel):
    dTemp:          float = 0.0
    dCloud:         float = 0.0
    dWind:          float = 0.0
    isWeekend:      bool = False
    isHoliday:      bool = False
    isPreHoliday:   bool = False
    isSchoolBreak:  bool = False


class ScenarioCreate(BaseModel):
    name:        str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    deltaPct:    float = 0.0
    direction:   str = Field("neutral", pattern="^(up|down|neutral)$")
    curve:       List[float] = Field(default_factory=list)
    deltas:      ScenarioDeltas = Field(default_factory=ScenarioDeltas)
    createdAt:   Optional[str] = None


@router.get("/")
def list_scenarios():
    """Список усіх збережених сценаріїв."""
    return {"items": get_scenarios()}


@router.post("/")
def create_scenario(req: ScenarioCreate):
    """Зберегти новий сценарій."""
    try:
        new_id = save_scenario(
            name=req.name,
            description=req.description,
            delta_pct=req.deltaPct,
            direction=req.direction,
            curve=req.curve,
            deltas=req.deltas.model_dump(),
            created_at=req.createdAt,
        )
        return get_scenario_by_id(new_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{scenario_id}")
def get_scenario(scenario_id: int):
    """Деталі окремого сценарію."""
    s = get_scenario_by_id(scenario_id)
    if not s:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
    return s


@router.delete("/{scenario_id}")
def remove_scenario(scenario_id: int):
    """Видалити сценарій."""
    if db_delete_scenario(scenario_id):
        return {"deleted": True, "id": scenario_id}
    raise HTTPException(status_code=404, detail="Сценарій не знайдено")


@router.post("/{scenario_id}/duplicate")
def duplicate_scenario_endpoint(scenario_id: int):
    """Дублює сценарій."""
    duplicated = db_duplicate_scenario(scenario_id)
    if not duplicated:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
    return duplicated

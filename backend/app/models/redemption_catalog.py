from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import CatalogCategory


class RedemptionCatalog(TimestampMixin, Base):
    """Platform reward catalog item redeemable with closed-loop points.

    Closed-loop ledger mechanics only without third-party payment gateway integration.
    Items are soft-deactivated via active=False rather than deleted.
    """

    __tablename__ = "redemption_catalog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    points_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[CatalogCategory] = mapped_column(
        Enum(CatalogCategory, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    redemptions = relationship("Redemption", back_populates="catalog_item")

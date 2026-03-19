from models.schemas import Customer

CUSTOMERS: list[Customer] = [
    Customer(id="cust-001", name="Acme Logistics", industry="Logistics", health_score=85, account_manager="Sarah Chen"),
    Customer(id="cust-002", name="GlobalFreight Inc", industry="Freight", health_score=72, account_manager="James Wilson"),
    Customer(id="cust-003", name="Neptune Shipping", industry="Shipping", health_score=91, account_manager="Sarah Chen"),
    Customer(id="cust-004", name="SwiftHaul Transport", industry="Transport", health_score=45, account_manager="Mike Rodriguez"),
    Customer(id="cust-005", name="OceanWave Carriers", industry="Shipping", health_score=67, account_manager="James Wilson"),
    Customer(id="cust-006", name="PrimeRoute Solutions", industry="Logistics", health_score=88, account_manager="Lisa Park"),
    Customer(id="cust-007", name="Atlas Supply Chain", industry="Supply Chain", health_score=53, account_manager="Mike Rodriguez"),
    Customer(id="cust-008", name="Meridian Exports", industry="Trade", health_score=79, account_manager="Lisa Park"),
    Customer(id="cust-009", name="Zenith Warehousing", industry="Warehousing", health_score=94, account_manager="Sarah Chen"),
    Customer(id="cust-010", name="Horizon Customs Brokers", industry="Customs", health_score=61, account_manager="James Wilson"),
    Customer(id="cust-011", name="Cargo Connect Ltd", industry="Freight", health_score=77, account_manager="Lisa Park"),
    Customer(id="cust-012", name="TradeWind Partners", industry="Trade", health_score=38, account_manager="Mike Rodriguez"),
    Customer(id="cust-013", name="Pinnacle Distribution", industry="Distribution", health_score=82, account_manager="Sarah Chen"),
    Customer(id="cust-014", name="BluePort Terminal", industry="Port Services", health_score=70, account_manager="James Wilson"),
    Customer(id="cust-015", name="RapidCargo Express", industry="Express Delivery", health_score=56, account_manager="Mike Rodriguez"),
]


def get_customers(search: str | None = None) -> list[Customer]:
    if not search:
        return CUSTOMERS
    q = search.lower()
    return [c for c in CUSTOMERS if q in c.name.lower() or q in c.industry.lower()]


def get_customer(customer_id: str) -> Customer | None:
    return next((c for c in CUSTOMERS if c.id == customer_id), None)

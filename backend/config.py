from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    use_mock_data: bool = True
    frontend_url: str = "http://localhost:5173"

    # Gainsight
    gainsight_api_url: str = ""
    gainsight_api_key: str = ""

    # Salesforce
    salesforce_client_id: str = ""
    salesforce_client_secret: str = ""
    salesforce_instance_url: str = ""

    # Gong
    gong_api_key: str = ""
    gong_api_secret: str = ""

    # RocketLane
    rocketlane_api_key: str = ""

    # Freshdesk
    freshdesk_domain: str = ""
    freshdesk_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

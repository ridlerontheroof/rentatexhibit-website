from pathlib import Path
import yaml

def test_required_property_context():
    data = yaml.safe_load(Path("config/property_context.yaml").read_text())
    assert data["property"]["name"] == "Exhibit on Superior"
    assert data["property"]["public_domain"] == "https://www.rentatexhibit.com"
    assert "02 Convertible" in data["balconies"]["confirmed_no_balcony_stacks"]
    assert "03 Convertible" in data["balconies"]["confirmed_no_balcony_stacks"]

def test_source_governance_exists():
    assert Path("config/source_governance.yaml").exists()

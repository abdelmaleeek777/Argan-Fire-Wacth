"""Debug script to check if routes are registered."""
from app import create_app

app = create_app()

print("\n" + "="*50)
print("REGISTERED ROUTES:")
print("="*50)
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint:30s} {str(rule.methods):30s} {rule.rule}")
print("="*50 + "\n")

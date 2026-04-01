from app import create_app
from flask_cors import CORS
from notification import process_notifications

app = create_app()
CORS(app)

@app.route("/test-notif")
def test_notif():
    print("➡️ Route appelée")
    try:
        process_notifications()
        return {"status": "ok", "message": "notification testée"}
    except Exception as e:
        print("❌ Erreur:", str(e))
        return {"status": "error", "message": str(e)}, 500

if __name__ == "__main__":
    app.run(debug=False, port=5000)
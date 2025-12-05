from flask import Flask, jsonify
from flask_cors import CORS

from api.query import bp_query
from api.command import bp_command
from domain.event_bus import event_bus
from domain.handlers import register_handlers


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(bp_query, url_prefix="/api/query")
    app.register_blueprint(bp_command, url_prefix="/api/command")

    register_handlers(event_bus)

    @app.get("/health")
    def health_root():
        return jsonify({"ok": True, "message": "Flask server is running"}), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

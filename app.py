from flask import Flask, render_template, request, jsonify
from waitress import serve
import database
from datetime import datetime
import uuid

app = Flask(__name__)

# Initialize DB on startup
database.init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        orders = database.get_all_orders()
        return jsonify({"success": True, "orders": orders})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.json
        if not data or 'items' not in data:
            return jsonify({"success": False, "error": "Invalid order data"}), 400
            
        items = data['items']
        if not items:
            return jsonify({"success": False, "error": "Order cannot be empty"}), 400

        total = sum(item['price'] * item['quantity'] for item in items)
        
        # Generate a short UUID for order ID like ORD-XXXXXX
        order_id = f"ORD-{str(uuid.uuid4()).split('-')[0][:6].upper()}"
        
        order_data = {
            "id": order_id,
            "items": items,
            "total": total,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "pending"
        }
        
        database.insert_order(order_data)
        
        return jsonify({"success": True, "order": order_data}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/orders/<order_id>/complete', methods=['POST'])
def complete_order(order_id):
    try:
        database.update_order_status(order_id, "completed")
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Use Waitress for production-quality serving
    print("Starting server on http://127.0.0.1:8080...")
    serve(app, host='127.0.0.1', port=8080)

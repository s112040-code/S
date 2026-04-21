import sqlite3
import json
import os

DB_PATH = 'beverage.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    # Create orders table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            items TEXT NOT NULL,
            total INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def insert_order(order_data):
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO orders (id, items, total, timestamp, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (order_data['id'], json.dumps(order_data['items']), order_data['total'], order_data['timestamp'], order_data['status']))
    conn.commit()
    conn.close()

def update_order_status(order_id, status):
    conn = get_db_connection()
    conn.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    conn.commit()
    conn.close()

def get_all_orders():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM orders ORDER BY timestamp DESC').fetchall()
    conn.close()
    
    orders = []
    for row in rows:
        order = dict(row)
        order['items'] = json.loads(order['items'])
        orders.append(order)
    return orders

if __name__ == '__main__':
    init_db()

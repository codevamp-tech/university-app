import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://unicampus:unicampus_dev%40qsd!3ous@54.86.247.222:5433/unicampus_db"
TENANT_ID = "d3b07384-d113-4956-a5db-e0e457e51c89"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        print("--- GRIEVANCES COUNT AND ROWS ---")
        r_g = await conn.execute(text("SELECT COUNT(*) FROM grievances WHERE tenant_id = :tid"), {"tid": TENANT_ID})
        print(f"Total grievances in DB: {r_g.scalar()}")
        
        r_g_rows = await conn.execute(text("""
            SELECT g.id, g.subject, g.student_id, u.username 
            FROM grievances g
            JOIN users u ON g.student_id = u.id
            WHERE g.tenant_id = :tid
        """), {"tid": TENANT_ID})
        rows = r_g_rows.fetchall()
        for row in rows:
            print(f"ID: {row[0]} | Subject: {row[1]} | User: {row[3]} ({row[2]})")
            
        print("\n--- STUDENT / FACULTY COUNT IN DB ---")
        r_s = await conn.execute(text("""
            SELECT r.name, COUNT(*) 
            FROM student s 
            JOIN roles r ON s.role_id = r.id 
            WHERE s.tenant_id = :tid 
            GROUP BY r.name
        """), {"tid": TENANT_ID})
        for row in r_s.fetchall():
            print(f"Role: {row[0]} -> Count: {row[1]}")
            
        print("\n--- FITNESS HEALTH METRIC LOGS COUNT ---")
        r_f = await conn.execute(text("SELECT COUNT(*) FROM fitness_plans"))
        print(f"fitness_plans: {r_f.scalar()}")
        r_h = await conn.execute(text("SELECT COUNT(*) FROM health_metric_logs"))
        print(f"health_metric_logs: {r_h.scalar()}")

if __name__ == "__main__":
    asyncio.run(main())

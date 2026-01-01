from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import random

scheduler = AsyncIOScheduler()

from app.services.regulation_updater import regulation_updater

async def recrawl_regulations():
    print("Executing scheduled regulation update...")
    regulation_updater.check_for_updates()

def start_scheduler():
    # Run every 1 hour for demonstration purposes (normally would be 24h)
    scheduler.add_job(
        recrawl_regulations,
        trigger=IntervalTrigger(hours=1),
        id="recrawl_job",
        replace_existing=True
    )
    scheduler.start()

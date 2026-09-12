from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

from app.services.regulation_updater import regulation_updater
from app.services.regulation_auto_seeder import regulation_auto_seeder

async def recrawl_regulations():
    logger.info("Executing scheduled regulation update and auto-seed check...")
    try:
        seeder_result = regulation_auto_seeder.seed_if_missing()
        logger.info(f"Auto-seed result: {seeder_result}")
    except Exception as e:
        logger.error(f"Scheduled auto-seed failed: {e}")
    
    try:
        regulation_updater.check_for_updates()
    except Exception as e:
        logger.error(f"Scheduled regulation_updater failed: {e}")

def start_scheduler():
    # Run every 6 hours to check and auto-sync regulations
    scheduler.add_job(
        recrawl_regulations,
        trigger=IntervalTrigger(hours=6),
        id="recrawl_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Background regulation scheduler started (interval=6h)")

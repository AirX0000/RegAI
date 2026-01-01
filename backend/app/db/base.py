# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.models.tenant import Tenant  # noqa
from app.db.models.user import User  # noqa
from app.db.models.company import Company  # noqa
from app.db.models.regulation import Regulation  # noqa
from app.db.models.report_regulation_link import ReportRegulationLink  # noqa
from app.db.models.link_company_regulation import LinkCompanyRegulation  # noqa
from app.db.models.impact_analysis import RegulationImpact  # noqa
from app.db.models.document import Document  # noqa
from app.db.models.audit_log import AuditLog  # noqa
from app.db.models.report import Report  # noqa
from app.db.models.report_analysis import ReportAnalysis  # noqa
from app.db.models.report_comment import ReportComment  # noqa
from app.db.models.report_template import ReportTemplate  # noqa
from app.db.models.tax_rate import TaxRate  # noqa
from app.db.session import Base  # noqa

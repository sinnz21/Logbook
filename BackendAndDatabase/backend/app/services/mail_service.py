"""Sends email through Gmail SMTP (smtp.gmail.com:587, STARTTLS).

Needs SMTP_USER and SMTP_PASSWORD in .env. SMTP_PASSWORD is a Gmail
*App Password* (16 letters), not the normal Gmail password.
"""
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings


class MailNotConfigured(RuntimeError):
    pass


def is_configured() -> bool:
    return bool(settings.SMTP_USER and settings.SMTP_PASSWORD)


def send_mail(to: str, subject: str, body: str) -> None:
    if not is_configured():
        raise MailNotConfigured("Email is not set up on the server (SMTP_USER / SMTP_PASSWORD in .env).")

    msg = EmailMessage()
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as s:
        s.starttls(context=ssl.create_default_context())
        # App passwords are shown with spaces ("abcd efgh ijkl mnop"); Gmail ignores them,
        # but strip anyway so either form works in .env.
        s.login(settings.SMTP_USER, settings.SMTP_PASSWORD.replace(" ", ""))
        s.send_message(msg)

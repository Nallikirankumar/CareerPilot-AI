"""
backend/conftest.py
===================
Pytest configuration for CareerPilot AI backend.
Bypasses blocked compiled Cython C-extensions on Windows environments.
"""

import os

os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

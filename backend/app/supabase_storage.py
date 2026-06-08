from __future__ import annotations

from typing import Optional

import httpx

from .config import settings

PDF_CONTENT_TYPE = "application/pdf"


class SupabaseStorageError(Exception):
    pass


class SupabaseStorage:
    def __init__(self) -> None:
        self.base_url = settings.supabase_url.rstrip("/")
        self.bucket = settings.supabase_bucket_name
        self.service_key = settings.supabase_service_role_key

    def _headers(self, content_type: Optional[str] = None) -> dict[str, str]:
        # Supabase Storage accepts legacy JWT service_role keys and new sb_secret_* keys.
        # New secret keys are not JWTs — both apikey and Authorization must be set to the
        # same secret value, or the gateway returns "Invalid Compact JWS".
        key = self.service_key.strip()
        headers: dict[str, str] = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _object_url(self, object_key: str) -> str:
        return f"{self.base_url}/storage/v1/object/{self.bucket}/{object_key}"

    def is_configured(self) -> bool:
        return settings.supabase_is_configured()

    @staticmethod
    def is_retriable_delete_error(exc: SupabaseStorageError) -> bool:
        message = str(exc).lower()
        if "connection failed" in message:
            return True
        if "delete failed (404)" in message:
            return True
        if "not configured" in message:
            return True
        return False

    def upload_pdf(self, object_key: str, content: bytes) -> None:
        if not self.is_configured():
            raise SupabaseStorageError("Supabase storage is not configured")
        url = self._object_url(object_key)
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    url,
                    content=content,
                    headers={**self._headers(PDF_CONTENT_TYPE), "x-upsert": "true"},
                )
        except httpx.HTTPError as exc:
            raise SupabaseStorageError(
                f"Storage connection failed for SUPABASE_URL='{self.base_url}': {exc}"
            ) from exc
        if response.status_code not in (200, 201):
            raise SupabaseStorageError(
                f"Upload failed ({response.status_code}): {response.text[:300]}"
            )

    def download(self, object_key: str) -> bytes:
        if not self.is_configured():
            raise SupabaseStorageError("Supabase storage is not configured")
        url = self._object_url(object_key)
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.get(url, headers=self._headers())
        except httpx.HTTPError as exc:
            raise SupabaseStorageError(
                f"Storage connection failed for SUPABASE_URL='{self.base_url}': {exc}"
            ) from exc
        if response.status_code != 200:
            raise SupabaseStorageError(
                f"Download failed ({response.status_code}): {response.text[:300]}"
            )
        return response.content

    def delete(self, object_key: str) -> None:
        if not self.is_configured():
            raise SupabaseStorageError("Supabase storage is not configured")
        url = self._object_url(object_key)
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.delete(url, headers=self._headers())
        except httpx.HTTPError as exc:
            raise SupabaseStorageError(
                f"Storage connection failed for SUPABASE_URL='{self.base_url}': {exc}"
            ) from exc
        if response.status_code not in (200, 204):
            raise SupabaseStorageError(
                f"Delete failed ({response.status_code}): {response.text[:300]}"
            )


def build_object_key(user_id: str, resume_id: str) -> str:
    return f"{user_id}/{resume_id}.pdf"


def build_storage_path(user_id: str, resume_id: str) -> str:
    return f"resumes/{user_id}/{resume_id}.pdf"

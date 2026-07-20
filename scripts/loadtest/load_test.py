#!/usr/bin/env python3
"""
Load Testing Script for LYC Intelligence Platform
Issue #29: Performance validation

Tests key API endpoints under concurrent load to validate platform stability.

Usage:
    # Basic test (10 concurrent, 50 requests)
    python scripts/loadtest/load_test.py

    # Custom test
    python scripts/loadtest/load_test.py --url https://lyc-intelligence.com --concurrency 20 --requests 200

    # Full test suite
    python scripts/loadtest/load_test.py --suite full

    # Authenticated endpoints (provide a JWT)
    python scripts/loadtest/load_test.py --jwt "eyJ..." --suite authenticated

Requirements:
    pip install aiohttp
"""

import asyncio
import argparse
import json
import time
import statistics
import sys
from dataclasses import dataclass, field
from typing import Optional

try:
    import aiohttp
except ImportError:
    print("Installing aiohttp...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp", "-q"])
    import aiohttp


# ─── Configuration ───────────────────────────────────────────────────────────

DEFAULT_BASE_URL = "https://lyc-intelligence.vercel.app"
DEFAULT_CONCURRENCY = 10
DEFAULT_REQUESTS = 50
TIMEOUT_SECONDS = 30

# Public endpoints (no auth required)
PUBLIC_ENDPOINTS = [
    {"method": "GET", "path": "/", "name": "Homepage", "expect_status": [200]},
    {"method": "GET", "path": "/api/ai/health", "name": "AI Health", "expect_status": [200, 401]},
    {"method": "GET", "path": "/api/assessments", "name": "Assessments List", "expect_status": [200, 401]},
    {"method": "GET", "path": "/api/backups/schedule", "name": "Backup Schedule", "expect_status": [200, 401, 500]},
]

# Authenticated endpoints (require JWT)
AUTH_ENDPOINTS = [
    {"method": "GET", "path": "/api/data/profiles/me", "name": "My Profile", "expect_status": [200, 401, 403]},
    {"method": "GET", "path": "/api/notifications", "name": "Notifications", "expect_status": [200, 401]},
    {"method": "GET", "path": "/api/mandates", "name": "Mandates List", "expect_status": [200, 401]},
    {"method": "GET", "path": "/api/candidates", "name": "Candidates List", "expect_status": [200, 401]},
    {"method": "GET", "path": "/api/assessments", "name": "Assessments", "expect_status": [200, 401]},
    {"method": "GET", "path": "/api/credits", "name": "Credits", "expect_status": [200, 401]},
    {"method": "GET", "path": "/api/admin/stats", "name": "Admin Stats", "expect_status": [200, 401, 403]},
    {"method": "GET", "path": "/api/backups/stats", "name": "Backup Stats", "expect_status": [200, 401, 403]},
    {"method": "GET", "path": "/api/search?q=test", "name": "Search", "expect_status": [200, 401]},
    {"method": "POST", "path": "/api/ai/chat", "name": "AI Chat", "body": {"message": "Hello", "conversationId": "load-test"}, "expect_status": [200, 401, 429]},
]

# Stress test endpoints (heavier operations)
STRESS_ENDPOINTS = [
    {"method": "POST", "path": "/api/ai/generate-questions", "name": "AI Generate Questions", "body": {"topic": "leadership", "count": 5}, "expect_status": [200, 401, 429, 500]},
    {"method": "GET", "path": "/api/analytics/overview", "name": "Analytics Overview", "expect_status": [200, 401, 500]},
]


# ─── Result Tracking ─────────────────────────────────────────────────────────

@dataclass
class RequestResult:
    endpoint_name: str
    method: str
    path: str
    status_code: int
    latency_ms: float
    success: bool
    error: Optional[str] = None
    expected: bool = True


@dataclass
class EndpointStats:
    name: str
    total_requests: int = 0
    successful: int = 0
    failed: int = 0
    unexpected_status: int = 0
    latencies: list = field(default_factory=list)
    errors: list = field(default_factory=list)

    @property
    def avg_latency(self) -> float:
        return statistics.mean(self.latencies) if self.latencies else 0

    @property
    def p50_latency(self) -> float:
        return statistics.median(self.latencies) if self.latencies else 0

    @property
    def p95_latency(self) -> float:
        if not self.latencies:
            return 0
        sorted_lat = sorted(self.latencies)
        idx = int(len(sorted_lat) * 0.95)
        return sorted_lat[min(idx, len(sorted_lat) - 1)]

    @property
    def p99_latency(self) -> float:
        if not self.latencies:
            return 0
        sorted_lat = sorted(self.latencies)
        idx = int(len(sorted_lat) * 0.99)
        return sorted_lat[min(idx, len(sorted_lat) - 1)]

    @property
    def success_rate(self) -> float:
        return (self.successful / self.total_requests * 100) if self.total_requests > 0 else 0


# ─── Load Test Engine ────────────────────────────────────────────────────────

class LoadTester:
    def __init__(self, base_url: str, jwt: Optional[str] = None, timeout: int = TIMEOUT_SECONDS):
        self.base_url = base_url.rstrip('/')
        self.jwt = jwt
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.results: list[RequestResult] = []
        self.stats: dict[str, EndpointStats] = {}

    def _get_headers(self) -> dict:
        headers = {"Content-Type": "application/json", "User-Agent": "LYC-LoadTest/1.0"}
        if self.jwt:
            headers["Authorization"] = f"Bearer {self.jwt}"
        return headers

    async def _make_request(
        self, session: aiohttp.ClientSession, endpoint: dict
    ) -> RequestResult:
        url = f"{self.base_url}{endpoint['path']}"
        name = endpoint['name']
        method = endpoint['method']
        expect_status = endpoint.get('expect_status', [200])

        start = time.perf_counter()
        try:
            if method == 'GET':
                async with session.get(url, headers=self._get_headers(), timeout=self.timeout) as resp:
                    await resp.read()
                    latency = (time.perf_counter() - start) * 1000
                    status = resp.status
            elif method == 'POST':
                body = endpoint.get('body', {})
                async with session.post(url, headers=self._get_headers(), json=body, timeout=self.timeout) as resp:
                    await resp.read()
                    latency = (time.perf_counter() - start) * 1000
                    status = resp.status
            else:
                latency = (time.perf_counter() - start) * 1000
                return RequestResult(name, method, endpoint['path'], 0, latency, False, error="Unsupported method")

            expected = status in expect_status
            success = status < 500  # 5xx is failure, 4xx is expected rejection

            return RequestResult(
                endpoint_name=name,
                method=method,
                path=endpoint['path'],
                status_code=status,
                latency_ms=latency,
                success=success,
                expected=expected,
            )

        except asyncio.TimeoutError:
            latency = (time.perf_counter() - start) * 1000
            return RequestResult(name, method, endpoint['path'], 0, latency, False, error="Timeout")
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            return RequestResult(name, method, endpoint['path'], 0, latency, False, error=str(e)[:100])

    async def _run_endpoint(
        self,
        session: aiohttp.ClientSession,
        endpoint: dict,
        num_requests: int,
        concurrency: int,
        semaphore: asyncio.Semaphore,
    ):
        name = endpoint['name']
        if name not in self.stats:
            self.stats[name] = EndpointStats(name=name)

        async def _worker():
            async with semaphore:
                result = await self._make_request(session, endpoint)
                self.results.append(result)
                stats = self.stats[name]
                stats.total_requests += 1
                stats.latencies.append(result.latency_ms)
                if result.success and result.expected:
                    stats.successful += 1
                elif result.success and not result.expected:
                    stats.unexpected_status += 1
                    stats.successful += 1  # Not a crash, but unexpected
                else:
                    stats.failed += 1
                    if result.error:
                        stats.errors.append(result.error)

        tasks = [asyncio.create_task(_worker()) for _ in range(num_requests)]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def run_suite(
        self,
        endpoints: list[dict],
        requests_per_endpoint: int,
        concurrency: int,
    ) -> dict:
        semaphore = asyncio.Semaphore(concurrency)
        overall_start = time.perf_counter()

        print(f"\n{'='*60}")
        print(f"  LYC Intelligence Load Test")
        print(f"  Target: {self.base_url}")
        print(f"  Endpoints: {len(endpoints)}")
        print(f"  Requests/endpoint: {requests_per_endpoint}")
        print(f"  Concurrency: {concurrency}")
        print(f"  Auth: {'JWT provided' if self.jwt else 'None (public only)'}")
        print(f"{'='*60}\n")

        async with aiohttp.ClientSession() as session:
            for endpoint in endpoints:
                print(f"  Testing: {endpoint['name']} ({endpoint['method']} {endpoint['path']})")
                await self._run_endpoint(session, endpoint, requests_per_endpoint, concurrency, semaphore)
                stats = self.stats[endpoint['name']]
                print(f"    → {stats.successful}/{stats.total_requests} OK, avg {stats.avg_latency:.0f}ms, p95 {stats.p95_latency:.0f}ms")

        overall_time = time.perf_counter() - overall_start
        return self._generate_report(overall_time)

    def _generate_report(self, total_time: float) -> dict:
        total_requests = sum(s.total_requests for s in self.stats.values())
        total_success = sum(s.successful for s in self.stats.values())
        total_failed = sum(s.failed for s in self.stats.values())
        all_latencies = []
        for s in self.stats.values():
            all_latencies.extend(s.latencies)

        report = {
            "summary": {
                "total_requests": total_requests,
                "successful": total_success,
                "failed": total_failed,
                "success_rate": (total_success / total_requests * 100) if total_requests > 0 else 0,
                "total_time_seconds": round(total_time, 2),
                "requests_per_second": round(total_requests / total_time, 2) if total_time > 0 else 0,
                "overall_avg_latency_ms": round(statistics.mean(all_latencies), 1) if all_latencies else 0,
                "overall_p50_ms": round(statistics.median(all_latencies), 1) if all_latencies else 0,
                "overall_p95_ms": round(sorted(all_latencies)[int(len(all_latencies) * 0.95)] if all_latencies else 0, 1),
            },
            "endpoints": {},
            "verdict": "PASS",
            "issues": [],
        }

        for name, stats in self.stats.items():
            report["endpoints"][name] = {
                "total": stats.total_requests,
                "success": stats.successful,
                "failed": stats.failed,
                "unexpected_status": stats.unexpected_status,
                "success_rate": round(stats.success_rate, 1),
                "avg_ms": round(stats.avg_latency, 1),
                "p50_ms": round(stats.p50_latency, 1),
                "p95_ms": round(stats.p95_latency, 1),
                "p99_ms": round(stats.p99_latency, 1),
            }

            # Check for issues
            if stats.success_rate < 90:
                report["issues"].append(f"⚠️  {name}: Low success rate ({stats.success_rate:.1f}%)")
                report["verdict"] = "WARN"
            if stats.failed > 0:
                report["issues"].append(f"❌ {name}: {stats.failed} failures")
                report["verdict"] = "FAIL"
            if stats.p95_latency > 10000:
                report["issues"].append(f"⚠️  {name}: High p95 latency ({stats.p95_latency:.0f}ms)")
                if report["verdict"] == "PASS":
                    report["verdict"] = "WARN"

        return report

    def print_report(self, report: dict):
        print(f"\n{'='*60}")
        print(f"  LOAD TEST RESULTS")
        print(f"{'='*60}")

        s = report["summary"]
        print(f"\n  Total Requests:    {s['total_requests']}")
        print(f"  Successful:        {s['successful']} ({s['success_rate']:.1f}%)")
        print(f"  Failed:            {s['failed']}")
        print(f"  Total Time:        {s['total_time_seconds']}s")
        print(f"  Throughput:        {s['requests_per_second']} req/s")
        print(f"  Avg Latency:       {s['overall_avg_latency_ms']}ms")
        print(f"  P50 Latency:       {s['overall_p50_ms']}ms")
        print(f"  P95 Latency:       {s['overall_p95_ms']}ms")

        print(f"\n  {'─'*56}")
        print(f"  {'Endpoint':<25} {'Success':>8} {'Avg(ms)':>8} {'P95(ms)':>8} {'Rate':>6}")
        print(f"  {'─'*56}")

        for name, ep in report["endpoints"].items():
            print(f"  {name:<25} {ep['success']:>5}/{ep['total']:<2} {ep['avg_ms']:>8.1f} {ep['p95_ms']:>8.1f} {ep['success_rate']:>5.1f}%")

        print(f"\n  {'─'*56}")
        print(f"  VERDICT: {report['verdict']}")

        if report["issues"]:
            print(f"\n  Issues:")
            for issue in report["issues"]:
                print(f"    {issue}")

        print(f"\n{'='*60}\n")


# ─── Test Suites ─────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="LYC Intelligence Load Test")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Base URL of the platform")
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY, help="Max concurrent requests")
    parser.add_argument("--requests", type=int, default=DEFAULT_REQUESTS, help="Requests per endpoint")
    parser.add_argument("--jwt", help="JWT token for authenticated endpoints")
    parser.add_argument("--suite", choices=["public", "authenticated", "full", "quick"], default="quick",
                        help="Test suite to run")
    parser.add_argument("--output", help="Save report to JSON file")
    parser.add_argument("--timeout", type=int, default=TIMEOUT_SECONDS, help="Request timeout in seconds")
    args = parser.parse_args()

    tester = LoadTester(args.url, jwt=args.jwt, timeout=args.timeout)

    # Select endpoints based on suite
    if args.suite == "public":
        endpoints = PUBLIC_ENDPOINTS
    elif args.suite == "authenticated":
        if not args.jwt:
            print("ERROR: --jwt is required for authenticated suite")
            sys.exit(1)
        endpoints = AUTH_ENDPOINTS
    elif args.suite == "full":
        endpoints = PUBLIC_ENDPOINTS + AUTH_ENDPOINTS + STRESS_ENDPOINTS
    elif args.suite == "quick":
        endpoints = PUBLIC_ENDPOINTS[:3]  # Just 3 quick public endpoints

    report = await tester.run_suite(endpoints, args.requests, args.concurrency)
    tester.print_report(report)

    # Save report if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"Report saved to {args.output}")

    # Return exit code based on verdict
    if report["verdict"] == "FAIL":
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())

import { describe, expect, it } from "vitest";
import {
  BLOCKED_THRESHOLD_MM,
  buildTimeTicks,
  detectBlockedIntervals,
  paddedPositionDomain,
} from "./e3-blocking";
import type { E1Row } from "./e1-csv-parser";

/**
 * detectBlockedIntervals가 참조하는 필드만 채운 테스트 행 생성.
 * 나머지 컬럼은 탐지 로직에 관여하지 않는다.
 */
function row(
  timestamp_ms: number,
  tof_distance_mm: number,
  tof_range_status: number | null = 0,
): E1Row {
  return { timestamp_ms, tof_distance_mm, tof_range_status } as E1Row;
}

describe("detectBlockedIntervals — range_status 기준", () => {
  it("비정상 status 행이 있으면 range_status 방식을 선택한다", () => {
    const rows = [row(0, 250, 0), row(20, 250, 4), row(40, 250, 0)];

    expect(detectBlockedIntervals(rows, [250, 250, 250]).method).toBe("range_status");
  });

  it("비정상 status 구간의 시작과 끝 timestamp를 반환한다", () => {
    const rows = [row(0, 250, 0), row(20, 250, 4), row(40, 250, 4), row(60, 250, 0)];

    expect(detectBlockedIntervals(rows, [250, 250, 250, 250]).intervals).toEqual([
      { x1: 20, x2: 60 },
    ]);
  });

  it("차단이 끝까지 이어지면 마지막 행 timestamp로 구간을 닫는다", () => {
    const rows = [row(0, 250, 0), row(20, 250, 4), row(40, 250, 4)];

    expect(detectBlockedIntervals(rows, [250, 250, 250]).intervals).toEqual([
      { x1: 20, x2: 40 },
    ]);
  });
});

describe("detectBlockedIntervals — threshold 기준", () => {
  it("비정상 status가 없으면 threshold 방식으로 전환한다", () => {
    const rows = [row(0, 250), row(20, 250)];

    expect(detectBlockedIntervals(rows, [250, 250]).method).toBe("threshold");
  });

  it("GT보다 임계값 이상 짧게 읽힌 구간을 차단으로 판정한다", () => {
    const blocked = 250 - BLOCKED_THRESHOLD_MM - 10;
    const rows = [row(0, 250), row(20, blocked), row(40, 250)];

    expect(detectBlockedIntervals(rows, [250, 250, 250]).intervals).toEqual([
      { x1: 20, x2: 40 },
    ]);
  });

  it("임계값 미만의 편차는 차단으로 보지 않는다", () => {
    const rows = [row(0, 250), row(20, 250 - BLOCKED_THRESHOLD_MM + 5), row(40, 250)];

    expect(detectBlockedIntervals(rows, [250, 250, 250]).intervals).toEqual([]);
  });

  it("GT가 100mm 이하인 종단 구간은 오탐하지 않는다", () => {
    const rows = [row(0, 10), row(20, 10)];

    expect(detectBlockedIntervals(rows, [90, 90]).intervals).toEqual([]);
  });
});

describe("paddedPositionDomain", () => {
  it("빈 배열이면 기본 도메인을 반환한다", () => {
    expect(paddedPositionDomain([])).toEqual([0, 600]);
  });

  it("데이터 범위를 감싸는 도메인을 반환한다", () => {
    const [min, max] = paddedPositionDomain([100, 500]);

    expect(min).toBeLessThan(100);
    expect(max).toBeGreaterThan(500);
  });

  it("음수 하한을 만들지 않는다", () => {
    expect(paddedPositionDomain([1, 2])[0]).toBe(0);
  });
});

describe("buildTimeTicks", () => {
  it("포인트가 10개 이하면 recharts 기본값에 위임한다", () => {
    expect(buildTimeTicks([0, 20, 40])).toBeUndefined();
  });

  it("마지막 timestamp를 항상 포함한다", () => {
    const timestamps = Array.from({ length: 50 }, (_, i) => i * 20);
    const ticks = buildTimeTicks(timestamps);

    expect(ticks?.at(-1)).toBe(980);
  });

  it("원본보다 적은 수의 tick으로 압축한다", () => {
    const timestamps = Array.from({ length: 50 }, (_, i) => i * 20);

    expect(buildTimeTicks(timestamps)!.length).toBeLessThan(timestamps.length);
  });
});

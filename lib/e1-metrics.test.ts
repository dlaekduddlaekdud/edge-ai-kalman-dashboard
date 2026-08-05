import { describe, expect, it } from "vitest";
import { getGroundTruth } from "@/lib/e1-metrics";
import type { E1Row } from "@/lib/e1-csv-parser";

/** getGroundTruth가 참조하는 필드만 채운 테스트 행. */
function row(tof_distance_mm: number, encoder_distance_mm: number, gt_distance_mm = 0): E1Row {
  return { tof_distance_mm, encoder_distance_mm, gt_distance_mm } as E1Row;
}

describe("getGroundTruth — CSV GT 우선", () => {
  it("gt_distance_mm에 0이 아닌 값이 하나라도 있으면 CSV 값을 그대로 쓴다", () => {
    const rows = [row(999, 0, 100), row(999, 10, 0), row(999, 20, 300)];

    expect(getGroundTruth(rows)).toEqual([100, 0, 300]);
  });

  it("gt_distance_mm이 전부 0이면 복원 경로로 넘어간다", () => {
    const rows = [row(200, 0), row(200, 50), row(100, 100)];

    expect(getGroundTruth(rows)).not.toEqual([0, 0, 0]);
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(getGroundTruth([])).toEqual([]);
  });
});

describe("getGroundTruth — 정적 시나리오 (enc_last < 1)", () => {
  it("엔코더가 움직이지 않으면 ToF 전체 평균을 상수 GT로 쓴다", () => {
    const rows = [row(100, 0), row(200, 0), row(300, 0)];

    expect(getGroundTruth(rows)).toEqual([200, 200, 200]);
  });

  it("enc_last가 0.9면 정적으로 판정한다", () => {
    const rows = [row(100, 0), row(300, 0.9)];

    expect(getGroundTruth(rows)).toEqual([200, 200]);
  });

  it("enc_last가 1이면 정적 판정을 하지 않고 보간 경로로 간다", () => {
    // ANCHOR=5이므로 앞뒤 앵커를 분리하려면 10행이 필요하다.
    // enc_last를 정확히 1로 두어 `encLast < 1` 경계 바로 위를 확인한다.
    const head = Array.from({ length: 5 }, () => row(300, 0));
    const tail = Array.from({ length: 5 }, () => row(100, 1));
    const gt = getGroundTruth([...head, ...tail]);

    // 정적 경로였다면 전체 ToF 평균 200이 상수로 나온다.
    // 보간 경로면 enc=0 지점은 300, enc=1 지점은 100이 된다.
    expect(gt[0]).toBeCloseTo(300, 5);
    expect(gt[9]).toBeCloseTo(100, 5);
  });
});

describe("getGroundTruth — 동적 시나리오 보간", () => {
  it("논문 4.1.2 수식대로 ToF 앵커 사이를 엔코더 비율로 분배한다", () => {
    // 5행 미만이므로 앵커는 전체 평균 = tofStart = tofEnd = 200
    // → 어느 지점이든 200이 나와야 한다
    const rows = [row(200, 0), row(200, 50), row(200, 100)];

    expect(getGroundTruth(rows)).toEqual([200, 200, 200]);
  });

  it("엔코더가 절반 지점이면 시작·끝 앵커의 중간값이 나온다", () => {
    // ANCHOR=5, 행이 5개 미만이면 전체 평균이 앵커가 되므로
    // 앵커 구분을 만들려면 앞뒤 5행씩 필요하다
    const head = Array.from({ length: 5 }, (_, i) => row(300, i));
    const tail = Array.from({ length: 5 }, (_, i) => row(100, 100 + i));
    const mid = row(0, 52); // tof는 앵커 계산에 안 쓰이는 위치
    const rows = [...head, mid, ...tail];

    // tofStart = 300, tofEnd = 100, encLast = 104
    // GT(mid) = 300 - (52/104) * (300 - 100) = 200
    const gt = getGroundTruth(rows);

    expect(gt[5]).toBeCloseTo(200, 5);
  });

  it("첫 행(enc=0)은 시작 앵커값과 같다", () => {
    const head = Array.from({ length: 5 }, () => row(300, 0));
    const tail = Array.from({ length: 5 }, (_, i) => row(100, 100 + i));

    expect(getGroundTruth([...head, ...tail])[0]).toBeCloseTo(300, 5);
  });
});
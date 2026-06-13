/*
 * 쏨킴 물리 코어 (AppPhysics)
 * ─────────────────────────────────────────────────────────────
 * 굴리기 / 던지기 / 점프 세 미니게임이 "공유"하는 물리 핵심.
 * STATE.md §4 원칙: 물리 코어 하나를 셋이 공유 → 각 게임은 "파라미터만" 바꾼다.
 * 설계 기준 = 굴리기(roll): 중력 · 마찰 · 탄성(충돌 반발) · 물컹(soft-body).
 *
 * 같은 PWA·같은 쏨킴 인스턴스에 마운트되는 모듈(단독 페이지 금지, 상태 연속성).
 * SVG/DOM은 일절 건드리지 않는다 — 순수 수치(body) 적분만. 렌더는 각 게임이 담당.
 *
 * 핵심 표현 원칙(§3): "타격은 빠르게, 복원은 느리게" + 물컹(불규칙 맥동).
 *
 * 세 게임의 매핑(파라미터만 다름):
 *   굴리기 = 탑다운 수평. gravity 0, 진행방향 휨(curve)으로 "머리 무게", 강한 마찰.
 *   던지기 = 측면 포물선. gravity↑, 휨 0, 마찰 거의 없음, 비행 중 물컹 흔들림.
 *   점프   = 측면 수직. gravity↑, 휨 0, 트램펄린 반발(restitution)로 통통.
 */
(function (global) {
  'use strict';

  // 게임별 프리셋 — 굴리기 수치를 기준선으로, 던지기/점프는 여기서 파생.
  var PRESETS = {
    // 굴리기: 거의 마찰로만 멈춤, 머리쪽이 무거워 휘는 주행
    roll:  { gravity: 0,    friction: 0.965, restitution: 0.60, wobble: 0.06, wobbleRate: 90, curve: 0.018, spin: 1.8, minSpeed: 0.35 },
    // 던지기: 포물선. 비행 중 미세 물컹, 마찰(공기저항) 미미
    throw: { gravity: 0.34, friction: 1.000, restitution: 0.00, wobble: 0.03, wobbleRate: 75, curve: 0,     spin: 0.6, minSpeed: 0.20 },
    // 점프: 수직 반동(트램펄린). 탄성 높게, 마찰 거의 없게
    jump:  { gravity: 0.50, friction: 0.999, restitution: 0.72, wobble: 0.02, wobbleRate: 80, curve: 0,     spin: 0.2, minSpeed: 0.45 }
  };

  // 물리 바디 하나(쏨킴). x,y=중심, vx,vy=속도, rot=시각 회전, r=반지름.
  function createBody(opts) {
    opts = opts || {};
    return {
      x: opts.x || 0, y: opts.y || 0,
      vx: opts.vx || 0, vy: opts.vy || 0,
      rot: 0,
      r: opts.r != null ? opts.r : 20
    };
  }

  // 월드 = 파라미터 + 적분/충돌 헬퍼. preset 이름이나 직접 파라미터를 넘긴다.
  function createWorld(params) {
    if (typeof params === 'string') params = PRESETS[params];
    var p = Object.assign({}, PRESETS.roll, params || {});

    return {
      params: p,

      // 한 프레임 적분(~60fps 가정, 굴리기/던지기와 동일 단위).
      // 순서: 휨 → 중력 → 물컹 → 마찰 → 이동 → 회전. 반환 = 적분 전 속력.
      integrate: function (b) {
        var sp = Math.hypot(b.vx, b.vy);

        // 휨(curve): 진행방향에 수직으로 밀기 = 굴리기 "머리 무게" 통제불능 주행
        if (p.curve && sp > 0.3) {
          var nx = -b.vy / sp, ny = b.vx / sp;
          b.vx += nx * sp * p.curve;
          b.vy += ny * sp * p.curve;
        }

        // 중력 (점프/던지기는 아래로, 굴리기는 0)
        b.vy += p.gravity;

        // 물컹(soft-body): 속도에 불규칙 맥동을 곱해 "들쭉날쭉"하게. 평균 ≈ 1.
        if (p.wobble) {
          var w = 1 + (Math.sin(performance.now() / p.wobbleRate) * 0.6 + (Math.random() - 0.5) * 0.8) * p.wobble;
          b.vx *= w; b.vy *= w;
        }

        // 마찰 / 공기저항
        b.vx *= p.friction; b.vy *= p.friction;

        // 이동
        b.x += b.vx; b.y += b.vy;

        // 회전(구르는 느낌) — 속력 비례
        b.rot += sp * p.spin;
        return sp;
      },

      // 사각 경계 반사. box={left,right,top,bottom} 중 필요한 면만. e=탄성(생략 시 preset).
      // 반환 = 마지막으로 부딪힌 면 이름(없으면 null).
      bounds: function (b, box) {
        var e = (box.e != null) ? box.e : p.restitution;
        var hit = null;
        if (box.left   != null && b.x < box.left   + b.r) { b.x = box.left   + b.r; b.vx =  Math.abs(b.vx) * e; hit = 'left'; }
        if (box.right  != null && b.x > box.right  - b.r) { b.x = box.right  - b.r; b.vx = -Math.abs(b.vx) * e; hit = 'right'; }
        if (box.top    != null && b.y < box.top    + b.r) { b.y = box.top    + b.r; b.vy =  Math.abs(b.vy) * e; hit = 'top'; }
        if (box.bottom != null && b.y > box.bottom - b.r) { b.y = box.bottom - b.r; b.vy = -Math.abs(b.vy) * e; hit = 'bottom'; }
        return hit;
      },

      // 원형 충돌 판정(핀·과녁·간식 등). cr 생략 시 점 대상.
      hitCircle: function (b, cx, cy, cr) {
        return Math.hypot(b.x - cx, b.y - cy) < (b.r + (cr || 0));
      },

      // 충돌 시 속도 흡수(핀 맞고 느려지기 등)
      absorb: function (b, k) { b.vx *= k; b.vy *= k; },

      // 정지 판정(세리머니/결과 진입)
      isResting: function (b) { return Math.hypot(b.vx, b.vy) < p.minSpeed; }
    };
  }

  /*
   * 물컹 변형(squash/stretch) 트랜스폼 문자열.
   * amount>0 = 가로로 퍼지고 세로로 납작(착지/타격), amount<0 = 길쭉(도약/늘림).
   * 부피 보존 근사(scale x*y≈1). 각 게임의 SVG transform에 그대로 붙인다.
   */
  function squash(amount) {
    var sx = 1 + amount;
    var sy = 1 - amount; // 부피 보존 근사
    return 'scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
  }

  global.AppPhysics = {
    PRESETS: PRESETS,
    createBody: createBody,
    createWorld: createWorld,
    squash: squash
  };

})(typeof window !== 'undefined' ? window : this);

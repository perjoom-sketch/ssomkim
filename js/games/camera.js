/*
 * 쏨킴 다이내믹 카메라 (AppCamera)
 * ─────────────────────────────────────────────────────────────
 * physics.js와 같은 패턴: 3종 공유, 순수 수치, SVG/DOM 최소 접촉.
 * 물리 좌표는 불변 — 카메라는 SVG viewBox 또는 wrapper transform으로만 동작.
 *
 * 기능: 줌(높이 연동) · 히트스톱(프레임 정지) · 스크린셰이크(착지 흔들림).
 * 원칙: "약하게 시작, 과하면 뺀다." 멀미·조작감 훼손 금지.
 */
(function (global) {
  'use strict';

  function create(svgEl, opts) {
    opts = opts || {};
    var baseVB = (opts.viewBox || svgEl.getAttribute('viewBox')).split(/\s+/).map(Number);
    var cx0 = baseVB[0] + baseVB[2] / 2;
    var cy0 = baseVB[1] + baseVB[3] / 2;
    var w0 = baseVB[2];
    var h0 = baseVB[3];

    var cam = {
      // 줌 — body.y 연동. groundY 기준, 위로 갈수록 줌아웃.
      zoomMin: opts.zoomMin || 0.82,
      zoomMax: opts.zoomMax || 1.0,
      zoomRange: opts.zoomRange || 250,   // 이 높이(px)에서 zoomMin 도달
      groundY: opts.groundY || cy0,
      zoomLerp: opts.zoomLerp || 0.06,    // 부드러운 보간 속도
      _zoom: 1,
      _targetZoom: 1,

      // 히트스톱 — 렌더 정지 프레임 수
      _stopFrames: 0,

      // 스크린셰이크
      _shakeT: 0,
      _shakeIntensity: 0,
      _shakeDur: 0,
      _shakeStart: 0,

      // 추적 대상 오프셋 (줌 시 캐릭터 중심으로 패닝)
      _panY: 0,
      _targetPanY: 0,
      panLerp: opts.panLerp || 0.05,
      panStrength: opts.panStrength || 0.35,

      hitstop: function (frames) {
        cam._stopFrames = frames || 3;
      },

      shake: function (intensity, duration) {
        cam._shakeIntensity = intensity || 3;
        cam._shakeDur = duration || 150;
        cam._shakeStart = performance.now();
      },

      // 매 프레임 호출. body를 넘기면 높이 기반 줌+팬 자동.
      // 반환: true=렌더 진행, false=히트스톱 중(렌더 스킵)
      update: function (body) {
        // 히트스톱
        if (cam._stopFrames > 0) {
          cam._stopFrames--;
          return false;
        }

        // 줌 목표 계산
        if (body) {
          var h = Math.max(0, cam.groundY - body.y);
          var t = Math.min(1, h / cam.zoomRange);
          cam._targetZoom = cam.zoomMax - (cam.zoomMax - cam.zoomMin) * t;
          cam._targetPanY = -h * cam.panStrength;
        }

        // lerp 보간
        cam._zoom += (cam._targetZoom - cam._zoom) * cam.zoomLerp;
        cam._panY += (cam._targetPanY - cam._panY) * cam.panLerp;

        // 셰이크 오프셋
        var sx = 0, sy = 0;
        var now = performance.now();
        var elapsed = now - cam._shakeStart;
        if (elapsed < cam._shakeDur) {
          var decay = 1 - elapsed / cam._shakeDur;
          sx = (Math.random() - 0.5) * 2 * cam._shakeIntensity * decay;
          sy = (Math.random() - 0.5) * 2 * cam._shakeIntensity * decay;
        }

        // viewBox 적용
        var z = cam._zoom;
        var vw = w0 / z;
        var vh = h0 / z;
        var vx = cx0 - vw / 2 + sx;
        var vy = cy0 - vh / 2 + cam._panY / z + sy;
        svgEl.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));

        return true;
      },

      // ready 상태 복귀 시 viewBox를 원래대로 부드럽게 되돌리기
      reset: function () {
        cam._targetZoom = 1;
        cam._targetPanY = 0;
        cam._stopFrames = 0;
      }
    };

    return cam;
  }

  global.AppCamera = {
    create: create
  };

})(typeof window !== 'undefined' ? window : this);

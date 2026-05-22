# Project Blueprint: Quadruped Autonomous Inspection System (QAIS)

## Overview
QAIS (Quadruped Autonomous Inspection System)는 LiDAR, RGB, 열화상, PTZ 카메라 등 첨단 센서가 탑재된 4족 보행 로봇을 위한 웹 기반 원격 관제 및 모니터링 대시보드입니다. 인프라 시설의 무인 자율 점검을 위해 설계되었습니다.

## 구현된 주요 기능
- **3D LiDAR 시각화:** Three.js를 이용한 실시간 점구름(Point Cloud) 매핑 시뮬레이션.
- **다중 센서 피드:** RGB, 열화상, PTZ 카메라의 상태를 모니터링하는 인터페이스 레이아웃.
- **실시간 텔레메트리:** 배터리, 온도, GPU 부하, 시스템 안정성 등 로봇 상태 정보 실시간 업데이트.
- **미션 컨트롤:** 자율 점검 미션 시작/중지 및 긴급 정지 제어 기능.
- **이벤트 로그:** 로봇의 작업 내역 및 이상 징후 감지 기록.
- **하이테크 UI:** Glassmorphism, OKLCH 컬러 시스템, 네온 액센트를 활용한 전문가용 다크 모드 디자인.

## 기술 스택
- **Frontend:** Vanilla JavaScript (ES Modules)
- **3D Visualization:** Three.js
- **Styling:** CSS Layers, Container Queries, OKLCH Colors
- **Layout:** CSS Grid & Flexbox

## 현재 상태
- **인터페이스:** 대시보드 전체 레이아웃 및 스타일링 완료.
- **데이터 시뮬레이션:** 센서 값 및 로그 데이터의 실시간 변동 로직 적용.
- **배포:** GitHub 저장소에 최종 코드 업로드 완료.

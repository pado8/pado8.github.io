import React from 'react';

function Main(props) {
    return (
        <div className='main'>
            <h1>메인 부분 입니다</h1><br />
            <h2>프론트엔드 개발자 노태효의 포트폴리오 사이트</h2><br />

            <br />
            <br />
            <br />
            CRA(Creat React App 환경) 없이 만들기 구조조정 해야함
            <br />
            <br />
            <br />




            스크롤 방식
            <br />
            홈페이지 로딩(파도치는?) + 404 필요
            <br />
            페이지 스크롤시 효과? 글자가 파도치듯 올라오는? 다시 올렷을때는? 파도가 부셔지듯 사라지는
            마우스 생김새도 추가
            맨위로 가기 버튼
            다크모드 적용 가능
            <br />

            <p style={{ fontSize: '25px', marginTop: '20px', marginBottom: '20px' }}>
                vercel 호스팅 확인
                <a href='https://portfolio-2019-five.vercel.app/' style={{ textDecorationLine: 'none' }} target='_blank'>https://portfolio-2019-five.vercel.app/</a>
            </p>


            ------------------------- 헤더 고정<br />
            이름 + 기타 인적사항 +파도 웨이브 + 프로필 사진 내얼굴<br />
            -------------------------<br />
            about. 섹션<br />
            자기소개 + 스킬 + 스펙<br />
            <br />
            +아이콘이랑 같이?<br />
            Languages / Frameworks / <br />
            - HTML/CSS SCSS JavaScript React NodeJS Git/Github WebPack <br />
            ------------------------<br />
            프로젝트 섹션<br />
            오른쪽 스와이프 가능 버튼으로도 가능(모바일 생각해서)<br />
            <br />
            프로젝트 1. 블로그<br />
            프로젝트 2. 처음만든포폴?<br /> vercel 무료사이트
            프로젝트 3. 회사에서 만든것들?<br />
            프로젝트 4. ( 23.09 해커톤 대회 나가게 되면 그걸로 프로젝트)
            프로젝트 4. 간단한 퍼포먼스형 프로젝트<br />  aws 무료 호스팅
            바다속 느낌 군데군데 미역이나 게 물고기 움직이는 애니메이션 + 마우스 커서에 따라 거품 따라다니고 몇개는 숨방울처럼 올라라고 군데군데 컨텐츠 텍스트 호버시 살짝 흔들리는 효과 텍스트 누루면 
            바다위까지 올라가는 애니 

            프로젝트 5. 자유여행 플래너 사이트  //어플까지 만들어서 배포? = 웹개발후 껍대기만 만들어서 (하이브리드 앱 or 그냥 웹앱)<br />
            유료 호스팅? 상업적 목적 가능성있음
            <br />구글지도 라벨
            <br />트리플 / 세이브트립(경비관리도있음) 참고

            메인화면
            심플한 화면 로그인(회원가입)
            어디로 떠나고싶으신가요??
            버튼


            //넣을 기능 리스트//
            시간 계획표
            지도로 여행 루트 보여주는 기능
            일정 리스트(a플랜 b플랜)
            쇼핑 리스트
            

            <br />
            ------------------------<br />
            컨텍트 섹션<br />
            감사인사 + 연락처 + 포부?<br />
        </div>
    );
}

export default Main;
import React from 'react';

function Header(props) {
    return (
        <div className='heater'>
            <h1>헤더 부분 입니다</h1><br />
            로고 /about / project / context 왼쪽           맨오른쪽 git 아이콘(주소연결되게끔) blog아이콘(블로그연결) 이력서다운로드
            <br />
            혹은
            <br />
            로고 -----------------------------------------  햄버거메뉴
            <br />
            햄버거 메뉴 클릭시
        </div>
    );
}

export default Header;
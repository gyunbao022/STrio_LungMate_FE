import React from 'react';
import ReactDOM from 'react-dom/client'; // React 18 버전의 새로운 API
import './style.css'; // 전역 CSS 스타일을 불러옵니다.
import App from './App'; // 우리가 만든 최상위 앱 컴포넌트를 불러옵니다.

// public/index.html 파일 안에 있는 <div id="root"></div> 요소를 찾습니다.
const rootElement = document.getElementById('root');

// 찾은 요소에 React 앱을 렌더링(표시)합니다.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

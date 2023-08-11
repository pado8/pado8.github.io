import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import Header from './component/Header';
import Footer from './component/Footer';
import Main from './component/Main';



function App() {
  return (
    <div>
      <Header></Header>
      <Main></Main>
      <Footer></Footer>
    </div>
  );
}

export default App;

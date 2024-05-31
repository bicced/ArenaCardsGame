import { Tabs } from 'antd';
import { PlayCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import Tools from './pages/Games';
import Leaderboard from './pages/Leaderboard';
import svgBackground from './assets/swords.svg';
import styled from 'styled-components';

//add a dark layer ontop of the background image
const Background = styled.div`
  background-image: url(${svgBackground});
  min-height: 100vh;
  padding: 20px;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8); /* Adjust the opacity as needed */
    z-index: 0;
  }
`;

function App() { 
  
  return (
    <Background>
      <Tabs
        defaultActiveKey="card"
        type="card"
        style={{width: '100%'}}
        items={[
          {
          label: <><PlayCircleOutlined /> Games</>,
          key: `tools`,
          children: <Tools />,
          },
          {
            label: <><TrophyOutlined /> Leaderboard</>,
            key: `tickets`,
            children: <Leaderboard />,
          }
        ]}
      />
    </Background>
  )
}

export default App

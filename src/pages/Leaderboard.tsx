import { Table, message } from "antd";
import { useEffect, useState } from "react";
import { fetchFromAPI } from "../api";
import styled from "styled-components";

const PlayerInfoRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const columns = [
  {
    title: 'Rank',
    render: (_: any, __: any, index: number) => index + 1,
    width: 100
  },
  {
    title: 'Player',
    render: (record: any) => (
      <PlayerInfoRow>
        <img style={{width: 40, borderRadius: '50%', marginRight: 10}} src={record.picture} alt="Player" />
        <p>{record.name}</p>
      </PlayerInfoRow>
    ),
    ellipsis: true,
    width: 250
  },
  {
    title: 'Score',
    dataIndex: 'score',
    width: 100
  },
  {
    title: 'Wins',
    dataIndex: 'wins',
    width: 100
  },
  {
    title: 'Losses',
    dataIndex: 'losses',
    width: 100
  },
  {
    title: 'Total Games',
    dataIndex: 'total',
    width: 100,
    fixed: 'right' as 'right'
  },
]

export default function Leaderboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(100);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard(currentPage);
  }, [currentPage]);

  const getLeaderboard = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetchFromAPI(`leaderboard?page=${page}&pageSize=${pageSize}&lastVisibleId=${lastVisibleId}`);
      const { data, total } = response;
      setLeaderboard(data.map((player: any) => ({ ...player, key: player.id })));
      setTotal(total);
      if (data.length > 0) {
        setLastVisibleId(data[data.length - 1].id);
      }
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      message.error(e.message);
    }
  }

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
  }

  return (
    <div>
      <h1>Leaderboard</h1>
      <Table
        loading={loading}
        dataSource={leaderboard}
        columns={columns}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: handleTableChange,
        }}
        scroll={{x: 768, y: 600}}
      />
    </div>
  )
}

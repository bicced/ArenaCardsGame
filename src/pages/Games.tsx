import { Button, Tooltip, Table, Tag, message } from "antd";
import { useEffect, useState } from "react";
import { fetchFromAPI } from "../api";
import styled from "styled-components";
import GameModal from "../components/GameModal";
import { ColumnsType } from "antd/es/table";
import { GameRecord } from "../types";

const PlayerInfoRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
`;

export default function Games() {
  const [loading, setLoading] = useState<boolean>(false);
  const [games, setGames] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(100);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<any>({});

  useEffect(() => {
    getGames(currentPage);
  }, [currentPage]);

  const getGames = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetchFromAPI(`games?page=${page}&pageSize=${pageSize}&lastVisibleId=${lastVisibleId}`);
      const { data, total, lastVisibleId: newLastVisibleId } = response;
      data.forEach((game: any) => {
        game.key = game.id;
      });
      console.log(data);
      setGames(data);
      setTotal(total);
      setLastVisibleId(newLastVisibleId);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      message.error('Failed to get games.');
    }
  }

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
  }

  const columns: ColumnsType<GameRecord> = [
    {
      title: 'Player 1',
      render: (record: GameRecord) => {
        const isWinner = record.result === 'player1';
        const truncatedName = record.player1.name.length > 10 ? `${record.player1.name.substring(0, 10)}...` : record.player1.name;
        return (
          <PlayerInfoRow>
            <img style={{ width: 40, borderRadius: '50%' }} src={record.player1.picture} alt="Player 1" />
            <Tooltip style={{ maxWidth: 100 }} title={record.player1.name}>{truncatedName}</Tooltip>
            {record.result === undefined ? null : <Tag color={isWinner ? 'green' : 'red'}>{isWinner ? 'Winner' : 'Loser'}</Tag>}
          </PlayerInfoRow>
        );
      },
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Player 2',
      render: (record: GameRecord) => {
        if (!record.player2) return null;
        const isWinner = record.result === 'player2';
        const truncatedName = record.player2.name.length > 10 ? `${record.player2.name.substring(0, 10)}...` : record.player2.name;
        return (
          <PlayerInfoRow>
            <img style={{ width: 40, borderRadius: '50%' }} src={record.player2.picture} alt="Player 2" />
            <Tooltip style={{ maxWidth: 100 }} title={record.player2.name}>{truncatedName}</Tooltip>
            <Tag color={isWinner ? 'green' : 'red'}>{isWinner ? 'Winner' : 'Loser'}</Tag>
          </PlayerInfoRow>
        );
      },
      width: 250,
      ellipsis: true,
    },
    {
      title: 'P1 Power',
      dataIndex: 'player1Power',
      width: 250,
    },
    {
      title: 'P2 Power',
      dataIndex: 'player2Power',
      width: 250,
    },
    {
      title: 'Game Status',
      dataIndex: 'status',
      render: (status: string) => <Tag color={status === 'complete' ? 'blue' : 'grey'}>{status}</Tag>,
      width: 250,
    },
    {
      title: 'Details',
      render: (record: GameRecord) => (
        <Button disabled={!record.result} onClick={() => onShowModal(record)} type="primary">
          View
        </Button>
      ),
      width: 100,
      fixed: 'right' as 'right', // Ensuring the type is correct
    },
  ];
  

  const onShowModal = (record: any) => {
    setSelectedGame(record);
    setShowModal(true);
  }

  return (
    <div>
      <h1>Games</h1>
      <Table
        loading={loading}
        dataSource={games}
        columns={columns}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: handleTableChange,
        }}
        scroll={{ x: 768, y: 600 }}
      />
      {showModal && <GameModal setShowModal={setShowModal} selectedGame={selectedGame} />}
    </div>
  )
}

import { Modal, Image, Tag, Tabs } from "antd";
import { useState } from "react";
import styled from "styled-components";
import { GameModalProps, NFT } from "../types";

const Label = styled.div`
  font-weight: bold;
  margin: 5px 0;
`;

const CardsTitle = styled.div`
  font-size: 20px;
  margin-bottom: 10px;
  text-align: center;
`;

const PlayerContainer = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  align-items: center;
  border-radius: 10px;
  width: 100%;
  cursor: pointer;
  margin: 5px;
  padding: 10px;
  border: ${({ selected }) => (selected ? '2px solid blue' : 'none')};
`;

const PlayerImage = styled.img`
  width: 40px;
  border-radius: 50%;
`;

const PlayerName = styled.p`
  margin: 10px;
`;

const DeckContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
`;

export default function GameModal({ selectedGame, setShowModal }: GameModalProps) {
  const [player, setPlayer] = useState<string>('player1');
  const [deck, setDeck] = useState<NFT[]>(selectedGame.player1Deck);

  const onPlayerChange = (playerKey: string) => {
    setPlayer(playerKey);
    setDeck(playerKey === 'player1' ? selectedGame.player1Deck : selectedGame.player2Deck);
  };

  const renderDeck = (filteredDeck: NFT[]) => {
    const totalPower = filteredDeck.reduce((acc, nft) => acc + nft.power, 0);
    
    return (
      <div>
        <CardsTitle>Cards: {filteredDeck.length} Power: {totalPower}</CardsTitle>
        <DeckContainer>
          {filteredDeck.map((nft) => (
            <div key={nft.token_id}>
              <Image style={{ width: 80 }} src={nft.imageURL} />
              <Label>Token ID: {nft.token_id}</Label>
              <Label>Power: {nft.power}</Label>
            </div>
          ))}
        </DeckContainer>
      </div>
    )
  };

  const renderDeckTabs = () => {
    const drawnCards = deck.filter((nft) => nft.type === 'drawn');
    const ownedCards = deck.filter((nft) => nft.type === 'owned');

    const items = [
      {
        key: 'owned',
        label: 'Owned Cards',
        children: renderDeck(ownedCards),
      },
      {
        key: 'drawn',
        label: 'Drawn Cards',
        children: renderDeck(drawnCards),
      },
    ];

    return (
      <Tabs defaultActiveKey="owned" style={{ width: '100%' }} items={items} />
    );
  };

  const renderPlayer = (selectPlayer: any, won: boolean, playerKey: string) => {
    const truncatedName = selectPlayer.name.length > 15 ? `${selectPlayer.name.substring(0, 15)}...` : selectPlayer.name;
    return (
      <PlayerContainer key={playerKey} selected={player === playerKey} onClick={() => onPlayerChange(playerKey)}>
        <PlayerImage src={selectPlayer.picture} />
        <PlayerName>{truncatedName}</PlayerName>
        <Tag color={won ? 'green' : 'red'}>{won ? 'Winner' : 'Loser'}</Tag>
      </PlayerContainer>
    )
  };

  const renderPlayersSelect = () => (
    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20}}>
      {renderPlayer(selectedGame.player1, selectedGame.result === 'player1', 'player1')}
      {renderPlayer(selectedGame.player2, selectedGame.result === 'player2', 'player2')}
    </div>
  );

  return (
    <Modal footer={null} open={true} onCancel={() => setShowModal(false)}>
      {renderPlayersSelect()}
      {renderDeckTabs()}
    </Modal>
  );
}

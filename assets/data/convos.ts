import { convoType } from "@/types"
import users from "./users"

const convos: Array<convoType> = [
    {
        id: 0,
        user: users[0],
        convoStarter: "The craw fish competition thing was lowkey dope",
        images: ["https://ca-times.brightspotcdn.com/dims4/default/a369988/2147483647/strip/true/crop/4000x2667+0+167/resize/2400x1600!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2F04%2Fee%2F0dee26814e2d9e276a97238af516%2Fallen-schaben-lens.jpg", "https://www.timeforkids.com/wp-content/uploads/2024/02/news_superbowl.jpg?w=1024"],
        videos: [],
        chats: [
            {
                id: '0',
                user: users[0],
                chat: " I know, right? That Astronomical event was something else. I loved how the game transformed during the concert. Epic Games really outdid themselves.",
                files: ["https://images.pushsquare.com/0efed47526cc5/gta-6-everything-we-know-so-far-guide-1.large.jpg", "https://cdn.vox-cdn.com/thumbor/-Mv3CkE4ATRqrxfo7fUcvFFfXGA=/0x0:1920x1080/2000x1333/filters:focal(960x540:961x541)/cdn.vox-cdn.com/uploads/chorus_asset/file/19921128/Fortnite_20200423190729.jpg"],
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: []}]
            },
            {
                id: '1',
                user: users[1],
                chat: "Oh, for sure. That concert was unlike anything I've ever seen in a game. The visuals were stunning",
                // files: [],
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
            {
                id: '2',
                user: users[2],
                chat: "Definitely. I loved how the game world transformed with each song. It was like being in a virtual music video.",
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
            {
                id: '3',
                user: users[0],
                chat: "Exactly! And the Travis Scott skin has some really awesome details. I especially like the different styles you can choose",
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
            {
                id: '4',
                user: users[4],
                chat: "Same here. The reactive elements are a nice touch, too. It's cool to see your character change during a match.",
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
            {
                id: '5',
                user: users[2],
                chat: "Did you notice how many people were wearing the skin right after it came out? It was like a Travis Scott army in every game.",
                files: ["https://cdn-0001.qstv.on.epicgames.com/WHlbhcGIdReBGoouTP/image/landscape_comp.jpeg"],
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
            {
                id: '6',
                user: users[3],
                chat: "Haha, yeah! It’s always fun to see how quickly everyone jumps on new skins, especially when they're as high-quality as this one.",
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
        ],
        activeInRoom: 32,
        location: "Cate Street Pub, Hammond",
        numberOfKeepUps: 12,
        dateCreated: "2021-04-25T21:30:05",
        lastUpdated: "2021-04-25T21:30:05"
    },
    {
        id: 1,
        user: users[1],
        convoStarter: "The craw fish competition thing was lowkey dope",
        // images: ["https://ezway.s3.amazonaws.com/jondo/nft/nft-header-1.jpg"],
        videos: [],
        chats: [
            {
                id: '1',
                user: users[0],
                chat: "Nah fr, Did you see nedd?😂",
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
        ],
        activeInRoom: 0,
        location: "Cate Street Pub, Hammond",
        numberOfKeepUps: 12,
        dateCreated: "2021-04-25T21:30:05",
        lastUpdated: "2021-04-25T21:30:05"
    },
    {
        id: 2,
        user: users[3],
        convoStarter: "Moving into a new home... love the decor😍",
        images: ["https://stylebyemilyhenderson.com/wp-content/uploads/2023/06/Emily-Henderson_Design-Trends_Refined-California-Casual_4.jpg"],
        videos: [],
        chats: [
            {
                id: '1',
                user: users[4],
                chat: "Looks real nice!",
                audio: '',
                dateCreated: "2021-04-25T21:30:05",
                lastUpdated: "2021-04-25T21:30:05",
                thread: [{ id: '1', chats: [] }]
            },
        ],
        activeInRoom: 0,
        location: "Cate Street Pub, Hammond",
        numberOfKeepUps: 12,
        dateCreated: "2021-04-25T21:30:05",
        lastUpdated: "2021-04-25T21:30:05"
    },
]

export default convos;

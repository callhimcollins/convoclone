import notificationType from '@/types';
import users from "./users";
import convos from "./convos";

const notifications: Array<notificationType> = [
    {
        id: '0',
        type: 'reply',
        to: users[0],
        from: users[3],
        convo: convos[1],
        topic: `replied to your chat in`,
        message: `Nah, I really was going to be up there fr😂`,
        dateCreated: "2021-04-25T21:30:05",
    },
    { 
        id: '1',
        type: 'keepup',
        to: users[0],
        from: users[2],
        topic: `started keeping up with you`,
        dateCreated: "2021-04-25T21:30:05",
    },
    {
        id: '2',
        type: 'highlight',
        to: users[0],
        from: users[4],
        topic: `is in highlights today. Check it out!`,
        dateCreated: "2021-04-25T21:30:05",
    },
    {
        id: '3',
        type: 'convoStart',
        to: users[0],
        from: users[1],
        convo: convos[2],
        topic: `started a Convo`,
        message: `${convos[2].convoStarter} `
    },
    {
        id: '4',
        type: 'keepup',
        to: users[0],
        from: users[2],
        convo: convos[0],
        topic: `started keeping up with your convo:`,
        dateCreated: "2021-04-25T21:30:05",
    },
    {
        id: '5',
        type: 'friend',
        to: users[0],
        from: users[1],
        topic: `from your contact list joined`,
    },
    {
        id: '6',
        type: 'special',
        special: true,
        message: 'Convo is hosting!',
        listForSpecial: users
    }
]

export default notifications;
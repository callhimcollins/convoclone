export type userType = {
    id?: Number,
    user_id?: string,
    email?: string,
    profileImage?: string,
    username?: string,
    name?: string,
    bio?: string,
    audio?: string,
    convos?: Array<convoType>,
    dateCreated?: string,
    lastUpdated?: string,
    backgroundProfileImage?: string
    links?: Array<linkType>,
    isRobot?: boolean,
    pushToken?: string,
    isNew?: boolean,
    badge_count?: number
}

export type blockedUserType = {
    id: Number,
    user_id?: string,
    blockedUserID?: string,
    blockedUserData?: userType,
}

export type userKeepUpType = {
    id: string,
    user_id: string,
    keepup_user_id: string,
    keepUpUserData: userType
}

export type privateCircleType = {
    id: Number,
    sender_id: string,
    receiver_id: string,
    senderUserData: userType,
    receiverUserData: userType,
    status: string,
    type: string
}

export type convoType = {
    id?: Number,
    user_id?: string,
    convo_id: string,
    Users?: userType,
    convoStarter?: string,
    files?: fileType[],
    audio: string,
    chats?: Array<chatType>,
    lastChat?: chatType,
    activeInRoom?: Number,
    location?: string,
    numberOfKeepUps: Number,
    dateCreated?: string,
    lastUpdated?: string,
    link?: string,
    dialogue: boolean,
    mediaIndex: number
}

export type experienceCheckType = {
    user_id: string,
    options: string[],
    feedback: string,
    positivePoints: number,
    negativePoints: number
}

export type linkType = {
    name: string,
    url: string,
}

export type threadType = {
    id?: String,
    chats?: Array<chatType>,
}

export type chatType = {
    id: String,
    convo_id: String,
    chat_id: String,
    user_id: String,
    replyChat: replyChat | null,
    Users: userType,
    content: string,
    thread?: Array<threadType>,
    audio?: string,
    files?: Array<string>,
    dateCreated?: string,
    lastUpdated?: string,
    lastChat?: any
}

export type replyChat = {
    id: String,
    user_id: String,
    username: string,
    content: string
}

export type highlightsType = {
    id: Number,
    highLightUsers?: Array<userType>
}

export type highlightsType2 = {
    convo_id?: string,
    status?: string,
    Convos: convoType
}

export type externalInputBoxType = {
    placeholder: string,
    icon: React.ReactNode,
    inputValue: string,
    onChangeValue: (value: string) => void,
    action: (value: any) => void,
    actionForKeyPress?: () => void
}

export type notificationType = {
    id: string,
    to?: userType,
    from?: userType,
    type: string,
    convo?: convoType,
    highlights?: Array<highlightsType>,
    dateCreated?: string,
    topic?: string,
    message?: string,
    special?: boolean,
    listForSpecial?: Array<userType>,
    action?: (value: any) => void,
    convoStarter?: String,
    data?: JSON,
    senderUserData?: userType,
    seen: boolean
}

export type systemNotificationType = {
    type: string
    message: string,
}

export type fileType = {
    uri: string;
    type: 'image' | 'video';
    width?: number;
    height?: number;
    duration?: number;
    fileUploading?: boolean
    assetId?: string
}

export type pushNotificationType = {
    expoPushToken: string,
    title: string,
    body: string
    extraData?: any
}

export type discoverType = {
    title: string,
    convo_id: string,
    Convos: convoType,
}
// l5Q69FWCl3tsY4jM
// npx cross-env EAS_NO_VCS=1 eas build --platform android --profile development
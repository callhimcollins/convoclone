export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blockedUsers: {
        Row: {
          blockedUserData: Json
          blockedUserID: string
          dateCreated: string
          id: number
          user_id: string
        }
        Insert: {
          blockedUserData: Json
          blockedUserID?: string
          dateCreated?: string
          id?: number
          user_id?: string
        }
        Update: {
          blockedUserData?: Json
          blockedUserID?: string
          dateCreated?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockedUsers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Chats: {
        Row: {
          audio: string | null
          chat_id: string
          content: string
          convo_id: string
          dateCreated: string
          files: Json | null
          id: number
          replyChat: Json | null
          user_id: string
          userData: Json
        }
        Insert: {
          audio?: string | null
          chat_id?: string
          content: string
          convo_id: string
          dateCreated?: string
          files?: Json | null
          id?: number
          replyChat?: Json | null
          user_id: string
          userData: Json
        }
        Update: {
          audio?: string | null
          chat_id?: string
          content?: string
          convo_id?: string
          dateCreated?: string
          files?: Json | null
          id?: number
          replyChat?: Json | null
          user_id?: string
          userData?: Json
        }
        Relationships: [
          {
            foreignKeyName: "Chats_convo_id_fkey"
            columns: ["convo_id"]
            isOneToOne: false
            referencedRelation: "Convos"
            referencedColumns: ["convo_id"]
          },
          {
            foreignKeyName: "Chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      convoKeepUps: {
        Row: {
          convo_id: string
          convoData: Json
          dateCreated: string
          id: number
          user_id: string
          userData: Json
        }
        Insert: {
          convo_id?: string
          convoData: Json
          dateCreated?: string
          id?: number
          user_id?: string
          userData: Json
        }
        Update: {
          convo_id?: string
          convoData?: Json
          dateCreated?: string
          id?: number
          user_id?: string
          userData?: Json
        }
        Relationships: [
          {
            foreignKeyName: "keepUps_convo_id_fkey"
            columns: ["convo_id"]
            isOneToOne: false
            referencedRelation: "Convos"
            referencedColumns: ["convo_id"]
          },
          {
            foreignKeyName: "keepUps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Convos: {
        Row: {
          audio: string | null
          convo_id: string
          convoStarter: string
          dateCreated: string
          deletedAt: string | null
          files: Json | null
          id: number
          lastChat: Json | null
          lastUpdated: string | null
          location: string | null
          private: boolean
          user_id: string
          userData: Json
        }
        Insert: {
          audio?: string | null
          convo_id?: string
          convoStarter: string
          dateCreated?: string
          deletedAt?: string | null
          files?: Json | null
          id?: number
          lastChat?: Json | null
          lastUpdated?: string | null
          location?: string | null
          private?: boolean
          user_id?: string
          userData: Json
        }
        Update: {
          audio?: string | null
          convo_id?: string
          convoStarter?: string
          dateCreated?: string
          deletedAt?: string | null
          files?: Json | null
          id?: number
          lastChat?: Json | null
          lastUpdated?: string | null
          location?: string | null
          private?: boolean
          user_id?: string
          userData?: Json
        }
        Relationships: [
          {
            foreignKeyName: "Convos_duplicate_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          convo: Json | null
          data: Json | null
          dateCreated: string
          deviceSeen: boolean
          id: number
          receiver_id: string
          seen: boolean
          sender_id: string
          senderUserData: Json
          system: boolean | null
          type: string
        }
        Insert: {
          convo?: Json | null
          data?: Json | null
          dateCreated?: string
          deviceSeen?: boolean
          id?: number
          receiver_id?: string
          seen?: boolean
          sender_id?: string
          senderUserData: Json
          system?: boolean | null
          type: string
        }
        Update: {
          convo?: Json | null
          data?: Json | null
          dateCreated?: string
          deviceSeen?: boolean
          id?: number
          receiver_id?: string
          seen?: boolean
          sender_id?: string
          senderUserData?: Json
          system?: boolean | null
          type?: string
        }
        Relationships: []
      }
      privateCircle: {
        Row: {
          created_at: string
          id: number
          receiver_id: string
          receiverUserData: Json
          sender_id: string
          senderIsBlocked: boolean
          senderUserData: Json
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          receiver_id?: string
          receiverUserData: Json
          sender_id?: string
          senderIsBlocked?: boolean
          senderUserData: Json
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          receiver_id?: string
          receiverUserData?: Json
          sender_id?: string
          senderIsBlocked?: boolean
          senderUserData?: Json
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "privateCircle_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "privateCircle_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      userKeepUps: {
        Row: {
          dateCreated: string
          id: number
          keepup_user_id: string
          keepUpUserData: Json
          user_id: string
        }
        Insert: {
          dateCreated?: string
          id?: number
          keepup_user_id?: string
          keepUpUserData: Json
          user_id?: string
        }
        Update: {
          dateCreated?: string
          id?: number
          keepup_user_id?: string
          keepUpUserData?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "userKeepUps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Users: {
        Row: {
          audio: string | null
          backgroundProfileImage: string | null
          bio: string | null
          convos: Json[] | null
          dateCreated: string | null
          email: string | null
          id: number
          lastUpdated: string | null
          name: string | null
          privateCircle: Json[] | null
          profileImage: string | null
          user_id: string
          username: string
        }
        Insert: {
          audio?: string | null
          backgroundProfileImage?: string | null
          bio?: string | null
          convos?: Json[] | null
          dateCreated?: string | null
          email?: string | null
          id?: number
          lastUpdated?: string | null
          name?: string | null
          privateCircle?: Json[] | null
          profileImage?: string | null
          user_id?: string
          username: string
        }
        Update: {
          audio?: string | null
          backgroundProfileImage?: string | null
          bio?: string | null
          convos?: Json[] | null
          dateCreated?: string | null
          email?: string | null
          id?: number
          lastUpdated?: string | null
          name?: string | null
          privateCircle?: Json[] | null
          profileImage?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

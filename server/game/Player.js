export class Player {
    constructor(id, nickname, avatarUrl) {
        this.id = id;
        this.socketId = null;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.score = 0;
        this.isHost = false;
        this.answers = {};
        this.abilities = [];
        this.connected = true;
    }
}
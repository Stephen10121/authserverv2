import io from 'socket.io-client';

export const useSocket = (url) => {
    const socket = io(url);
    return socket;
}

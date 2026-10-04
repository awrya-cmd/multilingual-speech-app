import React, { useEffect, useRef } from 'react';

export default function AudioVisualizer({ stream, isRecording }) {
    const canvasRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    useEffect(() => {
        if (!isRecording || !stream) {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sourceNode = audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();

        analyserNode.fftSize = 64;
        sourceNode.connect(analyserNode);

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');

        const draw = () => {
            animationFrameIdRef.current = requestAnimationFrame(draw);
            analyserNode.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 1.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;

                canvasCtx.fillStyle = '#2563eb';
                canvasCtx.fillRect(
                    x,
                    canvas.height - barHeight,
                    barWidth - 2,
                    barHeight
                );

                x += barWidth;
            }
        };

        draw();

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    }, [isRecording, stream]);

    return (
        <div className="visualizer-container">
            <canvas
                ref={canvasRef}
                width="400"
                height="60"
                className="visualizer-canvas"
            />
        </div>
    );
}
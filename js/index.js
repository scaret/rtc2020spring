const gridWidth = 400;
const gridHeight = 300;

function VideoGrid($elem){
    var self = this;
    self.$elem = $elem;
    self.videoContainers = [];
    self.index = 0;

    self.$elem.css({
        width: `${gridWidth}px`,
        height: `${gridHeight}px`
    });

    self.addVideoContainer = (videoContainer) =>{
        if (self.videoContainers.length >= 16){
            alert(`Video count exceeds 16`)
            return;
        }
        let putSuccess = self.putVideoContainerInitPosition(videoContainer);
        while (!putSuccess){
            for (var i in self.videoContainers){
                if(self.videoContainers[i].widthGrid > 1){
                    if (self.videoContainers.length == 1){
                        self.videoContainers[i].widthGrid -= 2;
                    }else if (self.videoContainers.length == 5){
                        self.videoContainers.forEach((container)=>{
                            container.widthGrid -=1;
                            container.calculateOccupies();
                        })
                    }else{
                        self.videoContainers[i].widthGrid -= 1;
                    }
                    self.videoContainers[i].calculateOccupies();
                    putSuccess = self.putVideoContainerInitPosition(videoContainer);
                }
            }
        }
        videoContainer.$video.on('playing', ()=>{
            self.$elem.append(videoContainer.$container);
            self.videoContainers.push(videoContainer);
            self.animatePositions();
            console.log('appended');
        });

        const handleContainerAnimation = (evt)=>{
            console.log("handleContainerAnimation", evt);
            window.evt = evt;
            const videoContainer = self.videoContainers.find((container)=>{
                return container.index == $(evt.target).attr("index");
            });
            console.log("handleContainerAnimation videoContainer", videoContainer);
            videoContainer.xGrid = parseInt(videoContainer.$container.css('left')) * 4 / gridWidth;
            videoContainer.yGrid = parseInt(videoContainer.$container.css('top')) * 4 / gridHeight;
            videoContainer.widthGrid = parseInt(videoContainer.$container.css('width')) * 4 / gridWidth;
            videoContainer.calculateOccupies();
        };
        videoContainer.$container.draggable({
            grid: [gridWidth / 4, gridHeight / 4],
            stop: handleContainerAnimation,
        });

        videoContainer.$container.resizable({
            grid: [gridWidth / 4, gridHeight / 4],
            aspectRatio: gridWidth / gridHeight,
            stop: handleContainerAnimation,
        });
    };

    self.putVideoContainerInitPosition = (videoContainer) =>{
        let positionFound = false;
        let widthGrid = null;
        let xGrid = null;
        let yGrid = null;
        let occupies = [];
        for (widthGrid = 4; widthGrid > 0; widthGrid--){
            for (yGrid = 0; yGrid + widthGrid <= 4; yGrid++){
                for (xGrid = 0; xGrid + widthGrid <= 4; xGrid++){
                    videoContainer.widthGrid = widthGrid;
                    videoContainer.xGrid = xGrid;
                    videoContainer.yGrid = yGrid;
                    videoContainer.calculateOccupies();
                    positionFound = true;
                    for (var containerId in self.videoContainers){
                        const existingContainer = self.videoContainers[containerId];
                        console.log("existingContainer.occupies", existingContainer.occupies, "videoContainer.occupies", videoContainer.occupies);
                        if (_.intersection(existingContainer.occupies, videoContainer.occupies).length){
                            positionFound = false;
                            break;
                        }
                    }
                    if (positionFound){
                        console.log("positionFound", xGrid, yGrid, widthGrid);
                        return true;
                    }
                }
            }
        }
    }

    self.animatePositions = function(){
        for (var i in self.videoContainers){
            const videoContainer = self.videoContainers[i];
            videoContainer.$container.css({
                'z-index': i
            });
            const aniConfig = {
                width: (videoContainer.widthGrid / 4 * 100) + '%',
                height: (videoContainer.widthGrid / 4 * 100) + '%',
                left: (videoContainer.xGrid / 4 * 100) + '%',
                top: (videoContainer.yGrid / 4 * 100) + '%',
            };
            console.log("aniConfig", aniConfig)
            videoContainer.$container.animate(aniConfig, 200);
            videoContainer.$container.css({
                'z-index': i
            });
        }
    }
}

function VideoContainer(mediaObject, videoGrid){
    var self = this;
    self.mediaObject = mediaObject;
    self.index = "" + videoGrid.index++;
    self.$video = $(`<video index="${self.index}" autoplay muted style="width: 100%;"></video>`);
    self.$video[0].srcObject = self.mediaObject;
    self.$container = $(`<div class="video-container" index="${self.index}" style="position: absolute; left: 0;"></div>`);
    self.$container.css({
        position: 'absolute',
    });
    self.$container.append(self.$video);
    console.log("self.$container", self.$container)
    $("#initVideoContainers").append(self.$container);

    self.widthGrid = 0;
    self.xGrid = 0;
    self.yGrid = 0;
    self.calculateOccupies = ()=>{
        self.occupies = [];
        for (var i = self.xGrid; i < self.xGrid + self.widthGrid; i++){
            for (var j = self.yGrid; j < self.yGrid + self.widthGrid; j++){
                self.occupies.push(i * 100 + j);
            }
        }
        console.log("x", self.xGrid, "y", self.yGrid, "size", self.widthGrid, "occupies", self.occupies)
    }
};

let videoGrid = null;

async function addOneVideoContainer(){
    const mediaObject = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {aspectRatio: gridWidth / gridHeight}
    });
    console.log("mediaObject", mediaObject);
    const videoContainer = new VideoContainer(mediaObject, videoGrid);
    videoGrid.addVideoContainer(videoContainer);
}

async function main(){

    videoGrid = new VideoGrid($("#videoGrid"));
    await addOneVideoContainer();

}

main();

export class RewardModel{
    totalDrace: number | undefined;
    totalxDrace: number | undefined;
    items: RewardItemModel[] | undefined;
}
export class RewardItemModel {
    startTime: Date | undefined;
    endTime: Date | undefined;
    draceReward: number | undefined;
    xdraceReward: number | undefined;
}
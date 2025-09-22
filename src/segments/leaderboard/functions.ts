export function getRank(point: number): string {
    switch (true) {
        case point >= 0 && point < 500:
            return "Bronze_1";
        case point >= 500 && point < 1000:
            return "Bronze_2";
        case point >= 1000 && point < 1500:
            return "Bronze_3";
        case point >= 1500 && point < 2000:
            return "Bronze_4";

        case point >= 2000 && point < 2500:
            return "Silver_1";
        case point >= 2500 && point < 3000:
            return "Silver_2";
        case point >= 3000 && point < 3500:
            return "Silver_3";
        case point >= 3500 && point < 4000:
            return "Silver_4";

        case point >= 4000 && point < 4500:
            return "Gold_1";
        case point >= 4500 && point < 5000:
            return "Gold_2";
        case point >= 5000 && point < 5500:
            return "Gold_3";
        case point >= 5500:
            return "Gold_4";

        default:
            return "Unknown";
    }
}
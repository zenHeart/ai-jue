interface AssetContent {
    [key: string]: any;
}
interface SkillConfig {
    name: string;
    description: string;
    [key: string]: any;
}
interface MergedConfig {
    prompts?: {
        [key: string]: AssetContent;
    };
    skills?: {
        [key: string]: SkillConfig;
    };
    [key: string]: any;
}
declare const _default: (options?: {
    language?: string;
}) => MergedConfig;
export = _default;

// get alignment data if given s_id and t_id;

import { fetchRelatedInstances } from "../../../api/instances";
import { fetchAnnotation, fetchInstance } from "../../../api/text";

async function prepareData(sourceInstanceId: string, targetInstanceId: string) {
    const sourceInstanceData = await fetchInstance(sourceInstanceId);
    const targetInstanceData = await fetchInstance(targetInstanceId);

    const relatedInstances = await fetchRelatedInstances(sourceInstanceId);

    const targetInstance = relatedInstances.find(instance => instance.instance_id === targetInstanceId);


    if(targetInstance?.annotation){
        const annotation = await fetchAnnotation(targetInstance?.annotation);
        return {
            source_text: sourceInstanceData.content,
            target_text: targetInstanceData.content,
            annotation: annotation,
           has_alignment: true,
        };
    }
    else{
 
        const source_segmentation = sourceInstanceData.annotations && typeof sourceInstanceData.annotations === 'object'
        ? Object.values(sourceInstanceData.annotations)
            .flat()
            .find((ann: unknown): ann is { type?: string; annotation_id?: string } => 
              typeof ann === 'object' && ann !== null && 'type' in ann && (ann as { type?: string }).type === 'segmentation'
            )
        : undefined;

        const target_segmentation = targetInstanceData.annotations && typeof targetInstanceData.annotations === 'object'
        ? Object.values(targetInstanceData.annotations)
            .flat()
            .find((ann: unknown): ann is { type?: string; annotation_id?: string } => 
              typeof ann === 'object' && ann !== null && 'type' in ann && (ann as { type?: string }).type === 'segmentation'
            )
        : undefined;

        const source_segmentation_data = await fetchAnnotation(source_segmentation?.annotation_id);
        const target_segmentation_data = await fetchAnnotation(target_segmentation?.annotation_id);

        return {
            source_text: sourceInstanceData.content,
            target_text: targetInstanceData.content,
            source_segmentation_data,
            target_segmentation_data,
            has_alignment: false,
        };
    }
}



export {prepareData}